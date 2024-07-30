import { StreamSfuClient } from './StreamSfuClient';
import {
  Dispatcher,
  getGenericSdp,
  isSfuEvent,
  Publisher,
  Subscriber,
} from './rtc';
import { muteTypeToTrackType } from './rtc/helpers/tracks';
import {
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
} from './helpers/participantUtils';
import { GoAwayReason, TrackType } from './gen/video/sfu/models/models';
import {
  registerEventHandlers,
  registerRingingCallEventHandlers,
} from './events/callEventHandlers';
import {
  CallingState,
  CallState,
  StreamVideoWriteableStateStore,
} from './store';
import { createSubscription, getCurrentValue } from './store/rxUtils';
import {
  AcceptCallResponse,
  BlockUserRequest,
  BlockUserResponse,
  CollectUserFeedbackRequest,
  CollectUserFeedbackResponse,
  EndCallResponse,
  GetCallResponse,
  GetCallStatsResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveRequest,
  GoLiveResponse,
  ListRecordingsResponse,
  ListTranscriptionsResponse,
  MuteUsersRequest,
  MuteUsersResponse,
  OwnCapability,
  PinRequest,
  PinResponse,
  QueryCallMembersRequest,
  QueryCallMembersResponse,
  RejectCallRequest,
  RejectCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SendCallEventRequest,
  SendCallEventResponse,
  SendReactionRequest,
  SendReactionResponse,
  SFUResponse,
  StartHLSBroadcastingResponse,
  StartRecordingRequest,
  StartRecordingResponse,
  StartTranscriptionRequest,
  StartTranscriptionResponse,
  StatsOptions,
  StopHLSBroadcastingResponse,
  StopLiveResponse,
  StopRecordingResponse,
  StopTranscriptionResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  UnpinRequest,
  UnpinResponse,
  UpdateCallMembersRequest,
  UpdateCallMembersResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from './gen/coordinator';
import { join } from './rtc/flows/join';
import {
  AudioTrackType,
  CallConstructor,
  CallLeaveOptions,
  DebounceType,
  JoinCallData,
  PublishOptions,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  SubscriptionChanges,
  TrackMuteType,
  VideoTrackType,
  VisibilityState,
} from './types';
import {
  BehaviorSubject,
  debounce,
  filter,
  map,
  Subject,
  takeWhile,
  timer,
} from 'rxjs';
import { TrackSubscriptionDetails } from './gen/video/sfu/signal_rpc/signal';
import {
  JoinResponse,
  Migration,
  VideoLayerSetting,
} from './gen/video/sfu/event/events';
import { Timestamp } from './gen/google/protobuf/timestamp';
import { createStatsReporter, SfuStatsReporter, StatsReporter } from './stats';
import { DynascaleManager } from './helpers/DynascaleManager';
import { PermissionsContext } from './permissions';
import { CallTypes } from './CallType';
import { StreamClient } from './coordinator/connection/client';
import {
  KnownCodes,
  retryInterval,
  sleep,
} from './coordinator/connection/utils';
import {
  AllCallEvents,
  CallEventListener,
  Logger,
  RejectReason,
  StreamCallEvent,
} from './coordinator/connection/types';
import { getClientDetails } from './client-details';
import { getLogger } from './logger';
import {
  CameraDirection,
  CameraManager,
  MicrophoneManager,
  ScreenShareManager,
  SpeakerManager,
} from './devices';
import { getSdkSignature } from './stats/utils';
import { withoutConcurrency } from './helpers/concurrency';

/**
 * An object representation of a `Call`.
 */
export class Call {
  /**
   * The type of the call.
   */
  readonly type: string;

  /**
   * The ID of the call.
   */
  readonly id: string;

  /**
   * The call CID.
   */
  readonly cid: string;

  /**
   * The state of this call.
   */
  readonly state = new CallState();

  /**
   * Flag indicating whether this call is "watched" and receives
   * updates from the backend.
   */
  watching: boolean;

  /**
   * Device manager for the camera
   */
  readonly camera: CameraManager;

  /**
   * Device manager for the microphone.
   */
  readonly microphone: MicrophoneManager;

  /**
   * Device manager for the speaker.
   */
  readonly speaker: SpeakerManager;

  /**
   * Device manager for the screen.
   */
  readonly screenShare: ScreenShareManager;

  /**
   * The DynascaleManager instance.
   */
  readonly dynascaleManager = new DynascaleManager(this);

  subscriber?: Subscriber;
  publisher?: Publisher;

  /**
   * Flag telling whether this call is a "ringing" call.
   */
  private readonly ringingSubject: Subject<boolean>;

  /**
   * The permissions context of this call.
   */
  readonly permissionsContext = new PermissionsContext();
  readonly logger: Logger;

  /**
   * The event dispatcher instance dedicated to this Call instance.
   * @private
   */
  private readonly dispatcher = new Dispatcher();

  private trackSubscriptionsSubject = new BehaviorSubject<{
    type: DebounceType;
    data: TrackSubscriptionDetails[];
  }>({ type: DebounceType.MEDIUM, data: [] });

  private statsReporter?: StatsReporter;
  private sfuStatsReporter?: SfuStatsReporter;
  private dropTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly clientStore: StreamVideoWriteableStateStore;
  public readonly streamClient: StreamClient;
  private sfuClient?: StreamSfuClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isLeaving = false;
  private initialized = false;
  private readonly joinLeaveConcurrencyTag = Symbol('joinLeaveConcurrencyTag');

  /**
   * A list hooks/functions to invoke when the call is left.
   * A typical use case is to clean up some global event handlers.
   * @private
   */
  private readonly leaveCallHooks: Set<Function> = new Set();

  private readonly streamClientBasePath: string;
  private streamClientEventHandlers = new Map<Function, () => void>();

  /**
   * Constructs a new `Call` instance.
   *
   * NOTE: Don't call the constructor directly, instead
   * Use the [`StreamVideoClient.call`](./StreamVideoClient.md/#call)
   * method to construct a `Call` instance.
   */
  constructor({
    type,
    id,
    streamClient,
    members,
    ownCapabilities,
    sortParticipantsBy,
    clientStore,
    ringing = false,
    watching = false,
  }: CallConstructor) {
    this.type = type;
    this.id = id;
    this.cid = `${type}:${id}`;
    this.ringingSubject = new BehaviorSubject(ringing);
    this.watching = watching;
    this.streamClient = streamClient;
    this.clientStore = clientStore;
    this.streamClientBasePath = `/call/${this.type}/${this.id}`;
    this.logger = getLogger(['Call']);

    const callTypeConfig = CallTypes.get(type);
    const participantSorter =
      sortParticipantsBy || callTypeConfig.options.sortParticipantsBy;
    if (participantSorter) {
      this.state.setSortParticipantsBy(participantSorter);
    }

    this.state.setMembers(members || []);
    this.state.setOwnCapabilities(ownCapabilities || []);
    this.state.setCallingState(
      ringing ? CallingState.RINGING : CallingState.IDLE,
    );

    this.camera = new CameraManager(this);
    this.microphone = new MicrophoneManager(this);
    this.speaker = new SpeakerManager(this);
    this.screenShare = new ScreenShareManager(this);
  }

  private async setup() {
    await withoutConcurrency(this.joinLeaveConcurrencyTag, async () => {
      if (this.initialized) {
        return;
      }

      this.leaveCallHooks.add(
        this.on('all', (event) => {
          // update state with the latest event data
          this.state.updateFromEvent(event);
        }),
      );

      this.leaveCallHooks.add(
        registerEventHandlers(this, this.state, this.dispatcher),
      );
      this.registerEffects();

      this.leaveCallHooks.add(
        createSubscription(
          this.trackSubscriptionsSubject.pipe(
            debounce((v) => timer(v.type)),
            map((v) => v.data),
          ),
          (subscriptions) =>
            this.sfuClient?.updateSubscriptions(subscriptions).catch((err) => {
              this.logger('debug', `Failed to update track subscriptions`, err);
            }),
        ),
      );

      if (this.state.callingState === CallingState.LEFT) {
        this.state.setCallingState(CallingState.IDLE);
      }

      this.initialized = true;
    });
  }

  private registerEffects() {
    this.leaveCallHooks.add(
      // handles updating the permissions context when the settings change.
      createSubscription(this.state.settings$, (settings) => {
        if (!settings) return;
        this.permissionsContext.setCallSettings(settings);
      }),
    );

    this.leaveCallHooks.add(
      // handle the case when the user permissions are modified.
      createSubscription(this.state.ownCapabilities$, (ownCapabilities) => {
        // update the permission context.
        this.permissionsContext.setPermissions(ownCapabilities);

        if (!this.publisher) return;

        // check if the user still has publishing permissions and stop publishing if not.
        const permissionToTrackType = {
          [OwnCapability.SEND_AUDIO]: TrackType.AUDIO,
          [OwnCapability.SEND_VIDEO]: TrackType.VIDEO,
          [OwnCapability.SCREENSHARE]: TrackType.SCREEN_SHARE,
        };
        for (const [permission, trackType] of Object.entries(
          permissionToTrackType,
        )) {
          const hasPermission = this.permissionsContext.hasPermission(
            permission as OwnCapability,
          );
          if (
            !hasPermission &&
            (this.publisher.isPublishing(trackType) ||
              this.publisher.isLive(trackType))
          ) {
            // Stop tracks, then notify device manager
            this.stopPublish(trackType)
              .catch((err) => {
                this.logger(
                  'error',
                  `Error stopping publish ${trackType}`,
                  err,
                );
              })
              .then(() => {
                if (
                  trackType === TrackType.VIDEO &&
                  this.camera.state.status === 'enabled'
                ) {
                  this.camera
                    .disable()
                    .catch((err) =>
                      this.logger(
                        'error',
                        `Error disabling camera after permission revoked`,
                        err,
                      ),
                    );
                }
                if (
                  trackType === TrackType.AUDIO &&
                  this.microphone.state.status === 'enabled'
                ) {
                  this.microphone
                    .disable()
                    .catch((err) =>
                      this.logger(
                        'error',
                        `Error disabling microphone after permission revoked`,
                        err,
                      ),
                    );
                }
              });
          }
        }
      }),
    );

    this.leaveCallHooks.add(
      // handles the case when the user is blocked by the call owner.
      createSubscription(this.state.blockedUserIds$, async (blockedUserIds) => {
        if (!blockedUserIds || blockedUserIds.length === 0) return;
        const currentUserId = this.currentUserId;
        if (currentUserId && blockedUserIds.includes(currentUserId)) {
          this.logger('info', 'Leaving call because of being blocked');
          await this.leave({ reason: 'user blocked' }).catch((err) => {
            this.logger('error', 'Error leaving call after being blocked', err);
          });
        }
      }),
    );

    this.leaveCallHooks.add(
      // watch for auto drop cancellation
      createSubscription(this.state.callingState$, (callingState) => {
        if (!this.ringing) return;
        if (
          callingState === CallingState.JOINED ||
          callingState === CallingState.JOINING ||
          callingState === CallingState.LEFT
        ) {
          clearTimeout(this.dropTimeout);
          this.dropTimeout = undefined;
        }
      }),
    );

    this.leaveCallHooks.add(
      // "ringing" mode effects and event handlers
      createSubscription(this.ringingSubject, (isRinging) => {
        if (!isRinging) return;
        const callSession = this.state.session;
        const receiver_id = this.clientStore.connectedUser?.id;
        const endedAt = this.state.endedAt;
        const created_by_id = this.state.createdBy?.id;
        const rejected_by = callSession?.rejected_by;
        const accepted_by = callSession?.accepted_by;
        let leaveCallIdle = false;
        if (endedAt) {
          // call was ended before it was accepted or rejected so we should leave it to idle
          leaveCallIdle = true;
        } else if (created_by_id && rejected_by) {
          if (rejected_by[created_by_id]) {
            // call was cancelled by the caller
            leaveCallIdle = true;
          }
        } else if (receiver_id && rejected_by) {
          if (rejected_by[receiver_id]) {
            // call was rejected by the receiver in some other device
            leaveCallIdle = true;
          }
        } else if (receiver_id && accepted_by) {
          if (accepted_by[receiver_id]) {
            // call was accepted by the receiver in some other device
            leaveCallIdle = true;
          }
        }
        if (leaveCallIdle) {
          if (this.state.callingState !== CallingState.IDLE) {
            this.state.setCallingState(CallingState.IDLE);
          }
        } else {
          this.scheduleAutoDrop();
          if (this.state.callingState === CallingState.IDLE) {
            this.state.setCallingState(CallingState.RINGING);
          }
          this.leaveCallHooks.add(registerRingingCallEventHandlers(this));
        }
      }),
    );
  }

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case.
   * For most use-cases, it should be enough to watch for state changes.
   *
   * @param eventName the event name.
   * @param fn the event handler.
   */
  on = <E extends keyof AllCallEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.on(eventName, fn);
    }

    const offHandler = this.streamClient.on(eventName, (e) => {
      const event = e as StreamCallEvent;
      if (event.call_cid && event.call_cid === this.cid) {
        fn(event as AllCallEvents[E]);
      }
    });

    // keep the 'off' reference returned by the stream client
    this.streamClientEventHandlers.set(fn, offHandler);
    return () => {
      this.off(eventName, fn);
    };
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param eventName the event name.
   * @param fn the event handler.
   */
  off = <E extends keyof AllCallEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.off(eventName, fn);
    }

    // unsubscribe from the stream client event by using the 'off' reference
    const registeredOffHandler = this.streamClientEventHandlers.get(fn);
    if (registeredOffHandler) {
      registeredOffHandler();
    }
  };

  /**
   * Leave the call and stop the media streams that were published by the call.
   */
  leave = async ({
    reject = false,
    reason = 'user is leaving the call',
  }: CallLeaveOptions = {}) => {
    await withoutConcurrency(this.joinLeaveConcurrencyTag, async () => {
      const callingState = this.state.callingState;
      if (callingState === CallingState.LEFT) {
        throw new Error('Cannot leave call that has already been left.');
      }

      if (callingState === CallingState.JOINING) {
        await this.assertCallJoined();
      }

      this.isLeaving = true;

      if (this.ringing) {
        // I'm the one who started the call, so I should cancel it.
        const hasOtherParticipants = this.state.remoteParticipants.length > 0;
        if (
          this.isCreatedByMe &&
          !hasOtherParticipants &&
          callingState === CallingState.RINGING
        ) {
          // Signals other users that I have cancelled my call to them
          // before they accepted it.
          await this.reject();
        } else if (reject && callingState === CallingState.RINGING) {
          // Signals other users that I have rejected the incoming call.
          await this.reject();
        }
      }

      this.statsReporter?.stop();
      this.statsReporter = undefined;

      this.sfuStatsReporter?.stop();
      this.sfuStatsReporter = undefined;

      this.subscriber?.close();
      this.subscriber = undefined;

      this.publisher?.close();
      this.publisher = undefined;

      this.sfuClient?.close(StreamSfuClient.NORMAL_CLOSURE, reason);
      this.sfuClient = undefined;

      this.state.setCallingState(CallingState.LEFT);

      // Call all leave call hooks, e.g. to clean up global event handlers
      this.leaveCallHooks.forEach((hook) => hook());
      this.initialized = false;
      this.clientStore.unregisterCall(this);

      this.camera.dispose();
      this.microphone.dispose();
      this.screenShare.dispose();
      this.speaker.dispose();

      const stopOnLeavePromises: Promise<void>[] = [];
      if (this.camera.stopOnLeave) {
        stopOnLeavePromises.push(this.camera.disable(true));
      }
      if (this.microphone.stopOnLeave) {
        stopOnLeavePromises.push(this.microphone.disable(true));
      }
      if (this.screenShare.stopOnLeave) {
        stopOnLeavePromises.push(this.screenShare.disable(true));
      }
      await Promise.all(stopOnLeavePromises);
    });
  };

  /**
   * A flag indicating whether the call is "ringing" type of call.
   */
  get ringing() {
    return getCurrentValue(this.ringingSubject);
  }

  /**
   * Retrieves the current user ID.
   */
  get currentUserId() {
    return this.clientStore.connectedUser?.id;
  }

  /**
   * A flag indicating whether the call was created by the current user.
   */
  get isCreatedByMe() {
    return this.state.createdBy?.id === this.currentUserId;
  }

  /**
   * Loads the information about the call.
   *
   * @param params.ring if set to true, a `call.ring` event will be sent to the call members.
   * @param params.notify if set to true, a `call.notification` event will be sent to the call members.
   * @param params.members_limit the total number of members to return as part of the response.
   */
  get = async (params?: {
    ring?: boolean;
    notify?: boolean;
    members_limit?: number;
  }) => {
    await this.setup();
    const response = await this.streamClient.get<GetCallResponse>(
      this.streamClientBasePath,
      params,
    );

    this.state.updateFromCallResponse(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (params?.ring || this.ringing) {
      // the call response can indicate where the call is still ringing or not
      this.ringingSubject.next(true);
    }

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    await this.applyDeviceConfig();

    return response;
  };

  /**
   * Loads the information about the call and creates it if it doesn't exist.
   *
   * @param data the data to create the call with.
   */
  getOrCreate = async (data?: GetOrCreateCallRequest) => {
    await this.setup();
    const response = await this.streamClient.post<
      GetOrCreateCallResponse,
      GetOrCreateCallRequest
    >(this.streamClientBasePath, data);

    this.state.updateFromCallResponse(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (data?.ring || this.ringing) {
      // the call response can indicate where the call is still ringing or not
      this.ringingSubject.next(true);
    }

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    await this.applyDeviceConfig();

    return response;
  };

  /**
   * Creates a call
   *
   * @param data the data to create the call with.
   */
  create = async (data?: GetOrCreateCallRequest) => {
    return this.getOrCreate(data);
  };

  /**
   * A shortcut for {@link Call.get} with `ring` parameter set to `true`.
   * Will send a `call.ring` event to the call members.
   */
  ring = async (): Promise<GetCallResponse> => {
    return await this.get({ ring: true });
  };

  /**
   * A shortcut for {@link Call.get} with `notify` parameter set to `true`.
   * Will send a `call.notification` event to the call members.
   */
  notify = async (): Promise<GetCallResponse> => {
    return await this.get({ notify: true });
  };

  /**
   * Marks the incoming call as accepted.
   *
   * This method should be used only for "ringing" call flows.
   * {@link Call.join} invokes this method automatically for you when joining a call.
   * Unless you are implementing a custom "ringing" flow, you should not use this method.
   */
  accept = async () => {
    return this.streamClient.post<AcceptCallResponse>(
      `${this.streamClientBasePath}/accept`,
    );
  };

  /**
   * Marks the incoming call as rejected.
   *
   * This method should be used only for "ringing" call flows.
   * {@link Call.leave} invokes this method automatically for you when you leave or reject this call.
   * Unless you are implementing a custom "ringing" flow, you should not use this method.
   *
   * @param reason the reason for rejecting the call.
   */
  reject = async (reason?: RejectReason): Promise<RejectCallResponse> => {
    return this.streamClient.post<RejectCallResponse, RejectCallRequest>(
      `${this.streamClientBasePath}/reject`,
      { reason: reason },
    );
  };

  /**
   * Will start to watch for call related WebSocket events and initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async (data?: JoinCallData): Promise<void> => {
    await this.setup();
    const callingState = this.state.callingState;
    if ([CallingState.JOINED, CallingState.JOINING].includes(callingState)) {
      this.logger(
        'warn',
        'Join method called twice, you should only call this once',
      );
      throw new Error(`Illegal State: Already joined.`);
    }

    const isMigrating = callingState === CallingState.MIGRATING;
    const isReconnecting = callingState === CallingState.RECONNECTING;
    this.state.setCallingState(CallingState.JOINING);
    this.logger('debug', 'Starting join flow');

    if (data?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    if (this.ringing && !this.isCreatedByMe) {
      // signals other users that I have accepted the incoming call.
      await this.accept();
    }

    let sfuServer: SFUResponse;
    let sfuToken: string;
    let connectionConfig: RTCConfiguration | undefined;
    let statsOptions: StatsOptions | undefined;
    try {
      if (this.sfuClient?.isFastReconnecting) {
        // use previous SFU configuration and values
        connectionConfig = this.publisher?.connectionConfiguration;
        sfuServer = this.sfuClient.sfuServer;
        sfuToken = this.sfuClient.token;
        statsOptions = this.sfuStatsReporter?.options;
      } else {
        // full join flow - let the Coordinator pick a new SFU for us
        const call = await join(this.streamClient, this.type, this.id, data);
        this.state.updateFromCallResponse(call.metadata);
        this.state.setMembers(call.members);
        this.state.setOwnCapabilities(call.ownCapabilities);
        connectionConfig = call.connectionConfig;
        sfuServer = call.sfuServer;
        sfuToken = call.token;
        statsOptions = call.statsOptions;
      }

      if (this.streamClient._hasConnectionID()) {
        this.watching = true;
        this.clientStore.registerCall(this);
      }
    } catch (error) {
      // restore the previous call state if the join-flow fails
      this.state.setCallingState(callingState);
      throw error;
    }

    const previousSfuClient = this.sfuClient;
    const sfuClient = (this.sfuClient = new StreamSfuClient({
      dispatcher: this.dispatcher,
      sfuServer,
      token: sfuToken,
      sessionId: previousSfuClient?.sessionId,
    }));

    /**
     * A closure which hides away the re-connection logic.
     */
    const reconnect = async (
      strategy: 'full' | 'fast' | 'migrate',
      reason: string,
    ): Promise<void> => {
      const currentState = this.state.callingState;
      if (
        currentState === CallingState.MIGRATING ||
        currentState === CallingState.RECONNECTING
      ) {
        // prevent parallel reconnection attempts
        return;
      }
      this.reconnectAttempts++;
      this.state.setCallingState(
        strategy === 'migrate'
          ? CallingState.MIGRATING
          : CallingState.RECONNECTING,
      );

      if (strategy === 'migrate') {
        this.logger(
          'debug',
          `[Migration]: migrating call ${this.cid} away from ${sfuServer.edge_name}`,
        );
        sfuClient.isMigratingAway = true;
      } else {
        this.logger(
          'debug',
          `[Rejoin]: ${strategy} rejoin call ${this.cid} (${this.reconnectAttempts})...`,
        );
      }

      // take a snapshot of the current "local participant" state
      // we'll need it for restoring the previous publishing state later
      const localParticipant = this.state.localParticipant;

      if (strategy === 'fast') {
        sfuClient.close(
          StreamSfuClient.ERROR_CONNECTION_BROKEN,
          `attempting fast reconnect: ${reason}`,
        );
      } else if (strategy === 'full') {
        // in migration or recovery scenarios, we don't want to
        // wait before attempting to reconnect to an SFU server
        await sleep(retryInterval(this.reconnectAttempts));

        // in full-reconnect, we need to dispose all Peer Connections
        this.subscriber?.close();
        this.subscriber = undefined;
        this.publisher?.close({ stopTracks: false });
        this.publisher = undefined;
        this.statsReporter?.stop();
        this.statsReporter = undefined;
        this.sfuStatsReporter?.stop();
        this.sfuStatsReporter = undefined;

        // clean up current connection
        sfuClient.close(
          StreamSfuClient.NORMAL_CLOSURE,
          `attempting full reconnect: ${reason}`,
        );
      }
      await this.join({
        ...data,
        ...(strategy === 'migrate' && { migrating_from: sfuServer.edge_name }),
      });

      // clean up previous connection
      if (strategy === 'migrate') {
        sfuClient.close(StreamSfuClient.NORMAL_CLOSURE, 'attempting migration');
      }

      this.logger(
        'info',
        `[Rejoin]: Attempt ${this.reconnectAttempts} successful!`,
      );
      // we shouldn't be republishing the streams if we're migrating
      // as the underlying peer connection will take care of it as part
      // of the ice-restart process
      if (localParticipant && strategy === 'full') {
        const {
          audioStream,
          videoStream,
          screenShareStream,
          screenShareAudioStream,
        } = localParticipant;

        let screenShare: MediaStream | undefined;
        if (screenShareStream || screenShareAudioStream) {
          screenShare = new MediaStream();
          screenShareStream?.getVideoTracks().forEach((track) => {
            screenShare?.addTrack(track);
          });
          screenShareAudioStream?.getAudioTracks().forEach((track) => {
            screenShare?.addTrack(track);
          });
        }

        // restore previous publishing state
        if (audioStream) await this.publishAudioStream(audioStream);
        if (videoStream) {
          await this.publishVideoStream(videoStream, {
            preferredCodec: this.camera.preferredCodec,
          });
        }
        if (screenShare) await this.publishScreenShareStream(screenShare);

        this.logger(
          'info',
          `[Rejoin]: State restored. Attempt: ${this.reconnectAttempts}`,
        );
      }
    };

    // reconnect if the connection was closed unexpectedly. example:
    // - SFU crash or restart
    // - network change
    sfuClient.signalReady.then(() => {
      // register a handler for the "goAway" event
      const unregisterGoAway = this.dispatcher.on('goAway', (event) => {
        const { reason } = event;
        this.logger(
          'info',
          `[Migration]: Going away from SFU... Reason: ${GoAwayReason[reason]}`,
        );
        reconnect('migrate', GoAwayReason[reason]).catch((err) => {
          this.logger(
            'warn',
            `[Migration]: Failed to migrate to another SFU.`,
            err,
          );
        });
      });

      sfuClient.signalWs.addEventListener('close', (e) => {
        // unregister the "goAway" handler, as we won't need it anymore for this connection.
        // the upcoming re-join will register a new handler anyway
        unregisterGoAway();
        // when the user has initiated "call.leave()" operation, we shouldn't
        // care for the WS close code and we shouldn't ever attempt to reconnect
        if (this.isLeaving) return;
        // do nothing if the connection was closed on purpose
        if (e.code === StreamSfuClient.NORMAL_CLOSURE) return;
        // do nothing if the connection was closed because of a policy violation
        // e.g., the user has been blocked by an admin or moderator
        if (e.code === KnownCodes.WS_POLICY_VIOLATION) return;
        // When the SFU is being shut down, it sends a goAway message.
        // While we migrate to another SFU, we might have the WS connection
        // to the old SFU closed abruptly. In this case, we don't want
        // to reconnect to the old SFU, but rather to the new one.
        const isMigratingAway =
          e.code === KnownCodes.WS_CLOSED_ABRUPTLY && sfuClient.isMigratingAway;
        const isFastReconnecting =
          e.code === KnownCodes.WS_CLOSED_ABRUPTLY &&
          sfuClient.isFastReconnecting;
        if (isMigratingAway || isFastReconnecting) return;

        // do nothing if the connection was closed because of a fast reconnect
        if (e.code === StreamSfuClient.ERROR_CONNECTION_BROKEN) return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          sfuClient.isFastReconnecting = this.reconnectAttempts === 0;
          const strategy = sfuClient.isFastReconnecting ? 'fast' : 'full';
          reconnect(strategy, `SFU closed the WS with code: ${e.code}`).catch(
            (err) => {
              this.logger(
                'error',
                `[Rejoin]: ${strategy} rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
                err,
              );
              this.state.setCallingState(CallingState.RECONNECTING_FAILED);
            },
          );
        } else {
          this.logger(
            'error',
            '[Rejoin]: Reconnect attempts exceeded. Giving up...',
          );
          this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        }
      });
    });

    // handlers for connection online/offline events
    const unsubscribeOnlineEvent = this.streamClient.on(
      'connection.changed',
      async (e) => {
        if (e.type !== 'connection.changed') return;
        if (!e.online) return;
        unsubscribeOnlineEvent();
        const currentCallingState = this.state.callingState;
        const shouldReconnect =
          currentCallingState === CallingState.OFFLINE ||
          currentCallingState === CallingState.RECONNECTING_FAILED;
        if (!shouldReconnect) return;
        this.logger('info', '[Rejoin]: Going online...');
        let isFirstReconnectAttempt = true;
        do {
          try {
            sfuClient.isFastReconnecting = isFirstReconnectAttempt;
            await reconnect(
              isFirstReconnectAttempt ? 'fast' : 'full',
              'Network: online',
            );
            return; // break the loop if rejoin is successful
          } catch (err) {
            this.logger(
              'error',
              `[Rejoin][Network]: Rejoin failed for attempt ${this.reconnectAttempts}`,
              err,
            );
          }
          // wait for a bit before trying to reconnect again
          await sleep(retryInterval(this.reconnectAttempts));
          isFirstReconnectAttempt = false;
        } while (this.reconnectAttempts < this.maxReconnectAttempts);

        // if we're here, it means that we've exhausted all the reconnect attempts
        this.logger('error', `[Rejoin][Network]: Rejoin failed. Giving up.`);
        this.state.setCallingState(CallingState.RECONNECTING_FAILED);
      },
    );
    const unsubscribeOfflineEvent = this.streamClient.on(
      'connection.changed',
      (e) => {
        if (e.type !== 'connection.changed') return;
        if (e.online) return;
        unsubscribeOfflineEvent();
        this.state.setCallingState(CallingState.OFFLINE);
      },
    );

    this.leaveCallHooks.add(() => {
      unsubscribeOnlineEvent();
      unsubscribeOfflineEvent();
    });

    if (!this.subscriber) {
      this.subscriber = new Subscriber({
        sfuClient,
        dispatcher: this.dispatcher,
        state: this.state,
        connectionConfig,
        onUnrecoverableError: () => {
          reconnect('full', 'unrecoverable subscriber error').catch((err) => {
            this.logger('debug', '[Rejoin]: Rejoin failed', err);
          });
        },
      });
    }

    // anonymous users can't publish anything hence, there is no need
    // to create Publisher Peer Connection for them
    const isAnonymous = this.streamClient.user?.type === 'anonymous';
    if (!this.publisher && !isAnonymous) {
      const audioSettings = this.state.settings?.audio;
      const isDtxEnabled = !!audioSettings?.opus_dtx_enabled;
      const isRedEnabled = !!audioSettings?.redundant_coding_enabled;
      this.publisher = new Publisher({
        sfuClient,
        dispatcher: this.dispatcher,
        state: this.state,
        connectionConfig,
        isDtxEnabled,
        isRedEnabled,
        onUnrecoverableError: () => {
          reconnect('full', 'unrecoverable publisher error').catch((err) => {
            this.logger('debug', '[Rejoin]: Rejoin failed', err);
          });
        },
      });
    }

    if (!this.statsReporter) {
      this.statsReporter = createStatsReporter({
        subscriber: this.subscriber,
        publisher: this.publisher,
        state: this.state,
        datacenter: this.sfuClient.edgeName,
      });
    }

    const clientDetails = getClientDetails();
    if (!this.sfuStatsReporter && statsOptions) {
      this.sfuStatsReporter = new SfuStatsReporter(sfuClient, {
        clientDetails,
        options: statsOptions,
        subscriber: this.subscriber,
        publisher: this.publisher,
      });
      this.sfuStatsReporter.start();
    }

    try {
      // 1. wait for the signal server to be ready before sending "joinRequest"
      sfuClient.signalReady
        .catch((err) => this.logger('error', 'Signal ready failed', err))
        // prepare a generic SDP and send it to the SFU.
        // this is a throw-away SDP that the SFU will use to determine
        // the capabilities of the client (codec support, etc.)
        .then(() => getGenericSdp('recvonly'))
        .then((sdp) => {
          const subscriptions = getCurrentValue(this.trackSubscriptionsSubject);
          const migration: Migration | undefined = isMigrating
            ? {
                fromSfuId: data?.migrating_from || '',
                subscriptions: subscriptions.data || [],
                announcedTracks: this.publisher?.getCurrentTrackInfos() || [],
              }
            : undefined;

          return sfuClient.join({
            subscriberSdp: sdp || '',
            clientDetails,
            migration,
            fastReconnect: previousSfuClient?.isFastReconnecting ?? false,
          });
        });

      // 2. in parallel, wait for the SFU to send us the "joinResponse"
      // this will throw an error if the SFU rejects the join request or
      // fails to respond in time
      const { callState, reconnected } = await this.waitForJoinResponse();
      if (isReconnecting) {
        this.logger('debug', '[Rejoin] fast reconnected:', reconnected);
      }
      if (isMigrating) {
        await this.subscriber.migrateTo(sfuClient, connectionConfig);
        await this.publisher?.migrateTo(sfuClient, connectionConfig);
      } else if (isReconnecting) {
        if (reconnected) {
          // update the SFU client instance on the subscriber and publisher
          this.subscriber.setSfuClient(sfuClient);
          // publisher might not be there (anonymous users)
          if (this.publisher) {
            this.publisher.setSfuClient(sfuClient);
            // and perform a full ICE restart on the publisher
            await this.publisher.restartIce();
          }
        } else if (previousSfuClient?.isFastReconnecting) {
          // reconnection wasn't possible, so we need to do a full rejoin
          return await reconnect('full', 're-attempting').catch((err) => {
            this.logger(
              'error',
              `[Rejoin]: Rejoin failed forced full rejoin.`,
              err,
            );
          });
        }
      }
      const currentParticipants = callState?.participants || [];
      const participantCount = callState?.participantCount;
      const startedAt = callState?.startedAt
        ? Timestamp.toDate(callState.startedAt)
        : new Date();
      const pins = callState?.pins ?? [];
      this.state.setParticipants(() => {
        const participantLookup = this.state.getParticipantLookupBySessionId();
        return currentParticipants.map<StreamVideoParticipant>((p) => {
          // We need to preserve the local state of the participant
          // (e.g. videoDimension, visibilityState, pinnedAt, etc.)
          // as it doesn't exist on the server.
          const existingParticipant = participantLookup[p.sessionId];
          return Object.assign(p, existingParticipant, {
            isLocalParticipant: p.sessionId === sfuClient.sessionId,
            viewportVisibilityState:
              existingParticipant?.viewportVisibilityState ?? {
                videoTrack: VisibilityState.UNKNOWN,
                screenShareTrack: VisibilityState.UNKNOWN,
              },
          } satisfies Partial<StreamVideoParticipant>);
        });
      });
      this.state.setParticipantCount(participantCount?.total || 0);
      this.state.setAnonymousParticipantCount(participantCount?.anonymous || 0);
      this.state.setStartedAt(startedAt);
      this.state.setServerSidePins(pins);

      this.reconnectAttempts = 0; // reset the reconnect attempts counter
      this.state.setCallingState(CallingState.JOINED);

      try {
        await this.initCamera({ setStatus: true });
        await this.initMic({ setStatus: true });
      } catch (error) {
        this.logger(
          'warn',
          'Camera and/or mic init failed during join call',
          error,
        );
      }

      // 3. once we have the "joinResponse", and possibly reconciled the local state
      // we schedule a fast subscription update for all remote participants
      // that were visible before we reconnected or migrated to a new SFU.
      const { remoteParticipants } = this.state;
      if (remoteParticipants.length > 0) {
        this.updateSubscriptions(remoteParticipants, DebounceType.FAST);
      }

      this.logger('info', `Joined call ${this.cid}`);
    } catch (err) {
      // join failed, try to rejoin
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.logger(
          'error',
          `[Rejoin]: Rejoin ${this.reconnectAttempts} failed.`,
          err,
        );
        await reconnect('full', 'previous attempt failed');
        this.logger(
          'info',
          `[Rejoin]: Rejoin ${this.reconnectAttempts} successful!`,
        );
      } else {
        this.logger(
          'error',
          `[Rejoin]: Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
        );
        this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        throw new Error('Join failed');
      }
    }
  };

  private waitForJoinResponse = (timeout: number = 5000) => {
    return new Promise<JoinResponse>((resolve, reject) => {
      const unsubscribe = this.on('joinResponse', (event) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(event);
      });

      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Waiting for "joinResponse" has timed out'));
      }, timeout);
    });
  };

  /**
   * Starts publishing the given video stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * Consecutive calls to this method will replace the previously published stream.
   * The previous video stream will be stopped.
   *
   * @param videoStream the video stream to publish.
   * @param opts the options to use when publishing the stream.
   */
  publishVideoStream = async (
    videoStream: MediaStream,
    opts: PublishOptions = {},
  ) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger('error', 'Trying to publish video before join is completed');
      throw new Error(`Call not joined yet.`);
    }

    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      this.logger('error', `There is no video track to publish in the stream.`);
      return;
    }

    await this.publisher.publishStream(
      videoStream,
      videoTrack,
      TrackType.VIDEO,
      opts,
    );
  };

  /**
   * Starts publishing the given audio stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * Consecutive calls to this method will replace the audio stream that is currently being published.
   * The previous audio stream will be stopped.
   *
   * @param audioStream the audio stream to publish.
   */
  publishAudioStream = async (audioStream: MediaStream) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger('error', 'Trying to publish audio before join is completed');
      throw new Error(`Call not joined yet.`);
    }

    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      this.logger('error', `There is no audio track in the stream to publish`);
      return;
    }

    await this.publisher.publishStream(
      audioStream,
      audioTrack,
      TrackType.AUDIO,
    );
  };

  /**
   * Starts publishing the given screen-share stream to the call.
   *
   * Consecutive calls to this method will replace the previous screen-share stream.
   * The previous screen-share stream will be stopped.
   *
   * @param screenShareStream the screen-share stream to publish.
   * @param opts the options to use when publishing the stream.
   */
  publishScreenShareStream = async (
    screenShareStream: MediaStream,
    opts: PublishOptions = {},
  ) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger(
        'error',
        'Trying to publish screen share before join is completed',
      );
      throw new Error(`Call not joined yet.`);
    }

    const [screenShareTrack] = screenShareStream.getVideoTracks();
    if (!screenShareTrack) {
      this.logger(
        'error',
        `There is no video track in the screen share stream to publish`,
      );
      return;
    }

    await this.publisher.publishStream(
      screenShareStream,
      screenShareTrack,
      TrackType.SCREEN_SHARE,
      opts,
    );

    const [screenShareAudioTrack] = screenShareStream.getAudioTracks();
    if (screenShareAudioTrack) {
      await this.publisher.publishStream(
        screenShareStream,
        screenShareAudioTrack,
        TrackType.SCREEN_SHARE_AUDIO,
        opts,
      );
    }
  };

  /**
   * Stops publishing the given track type to the call, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   *
   * @param trackType the track type to stop publishing.
   * @param stopTrack if `true` the track will be stopped, else it will be just disabled
   */
  stopPublish = async (trackType: TrackType, stopTrack: boolean = true) => {
    this.logger(
      'info',
      `stopPublish ${TrackType[trackType]}, stop tracks: ${stopTrack}`,
    );
    await this.publisher?.unpublishStream(trackType, stopTrack);
  };

  /**
   * Notifies the SFU that a noise cancellation process has started.
   *
   * @internal
   */
  notifyNoiseCancellationStarting = async () => {
    return this.sfuClient?.startNoiseCancellation().catch((err) => {
      this.logger('warn', 'Failed to notify start of noise cancellation', err);
    });
  };

  /**
   * Notifies the SFU that a noise cancellation process has stopped.
   *
   * @internal
   */
  notifyNoiseCancellationStopped = async () => {
    return this.sfuClient?.stopNoiseCancellation().catch((err) => {
      this.logger('warn', 'Failed to notify stop of noise cancellation', err);
    });
  };

  /**
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant for all the different kinds of tracks you want to receive.
   * You can only subscribe for tracks after the participant started publishing the given kind of track.
   *
   * @param trackType the kind of subscription to update.
   * @param changes the list of subscription changes to do.
   * @param type the debounce type to use for the update.
   */
  updateSubscriptionsPartial = (
    trackType: VideoTrackType | 'video' | 'screen',
    changes: SubscriptionChanges,
    type: DebounceType = DebounceType.SLOW,
  ) => {
    if (trackType === 'video') {
      this.logger(
        'warn',
        `updateSubscriptionsPartial: ${trackType} is deprecated. Please switch to 'videoTrack'`,
      );
      trackType = 'videoTrack';
    } else if (trackType === 'screen') {
      this.logger(
        'warn',
        `updateSubscriptionsPartial: ${trackType} is deprecated. Please switch to 'screenShareTrack'`,
      );
      trackType = 'screenShareTrack';
    }

    const participants = this.state.updateParticipants(
      Object.entries(changes).reduce<StreamVideoParticipantPatches>(
        (acc, [sessionId, change]) => {
          if (change.dimension?.height) {
            change.dimension.height = Math.ceil(change.dimension.height);
          }
          if (change.dimension?.width) {
            change.dimension.width = Math.ceil(change.dimension.width);
          }
          const prop: keyof StreamVideoParticipant | undefined =
            trackType === 'videoTrack'
              ? 'videoDimension'
              : trackType === 'screenShareTrack'
                ? 'screenShareDimension'
                : undefined;
          if (prop) {
            acc[sessionId] = {
              [prop]: change.dimension,
            };
          }
          return acc;
        },
        {},
      ),
    );

    if (participants) {
      this.updateSubscriptions(participants, type);
    }
  };

  private updateSubscriptions = (
    participants: StreamVideoParticipant[],
    type: DebounceType = DebounceType.SLOW,
  ) => {
    const subscriptions: TrackSubscriptionDetails[] = [];
    for (const p of participants) {
      // we don't want to subscribe to our own tracks
      if (p.isLocalParticipant) continue;

      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.
      if (p.videoDimension && hasVideo(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.VIDEO,
          dimension: p.videoDimension,
        });
      }
      if (p.screenShareDimension && hasScreenShare(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: p.screenShareDimension,
        });
      }
      if (hasScreenShareAudio(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE_AUDIO,
        });
      }
    }
    // schedule update
    this.trackSubscriptionsSubject.next({ type, data: subscriptions });
  };

  /**
   * Will enhance the reported stats with additional participant-specific information (`callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore)).
   * This is usually helpful when detailed stats for a specific participant are needed.
   *
   * @param sessionId the sessionId to start reporting for.
   */
  startReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.startReportingStatsFor(sessionId);
  };

  /**
   * Opposite of `startReportingStatsFor`.
   * Will turn off stats reporting for a specific participant.
   *
   * @param sessionId the sessionId to stop reporting for.
   */
  stopReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.stopReportingStatsFor(sessionId);
  };

  /**
   * Resets the last sent reaction for the user holding the given `sessionId`. This is a local action, it won't reset the reaction on the backend.
   *
   * @param sessionId the session id.
   */
  resetReaction = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      reaction: undefined,
    });
  };

  /**
   * Sets the list of criteria to sort the participants by.
   *
   * @param criteria the list of criteria to sort the participants by.
   */
  setSortParticipantsBy: CallState['setSortParticipantsBy'] = (criteria) => {
    return this.state.setSortParticipantsBy(criteria);
  };

  /**
   * Updates the list of video layers to publish.
   *
   * @internal
   * @param enabledLayers the list of layers to enable.
   */
  updatePublishQuality = async (enabledLayers: VideoLayerSetting[]) => {
    return this.publisher?.updateVideoPublishQuality(enabledLayers);
  };

  private assertCallJoined = () => {
    return new Promise<void>((resolve) => {
      this.state.callingState$
        .pipe(
          takeWhile((state) => state !== CallingState.JOINED, true),
          filter((s) => s === CallingState.JOINED),
        )
        .subscribe(() => resolve());
    });
  };

  /**
   * Sends a reaction to the other call participants.
   *
   * @param reaction the reaction to send.
   */
  sendReaction = async (
    reaction: SendReactionRequest,
  ): Promise<SendReactionResponse> => {
    return this.streamClient.post<SendReactionResponse, SendReactionRequest>(
      `${this.streamClientBasePath}/reaction`,
      reaction,
    );
  };

  /**
   * Blocks the user with the given `userId`.
   *
   * @param userId the id of the user to block.
   */
  blockUser = async (userId: string) => {
    return this.streamClient.post<BlockUserResponse, BlockUserRequest>(
      `${this.streamClientBasePath}/block`,
      {
        user_id: userId,
      },
    );
  };

  /**
   * Unblocks the user with the given `userId`.
   *
   * @param userId the id of the user to unblock.
   */
  unblockUser = async (userId: string) => {
    return this.streamClient.post<UnblockUserResponse, UnblockUserRequest>(
      `${this.streamClientBasePath}/unblock`,
      {
        user_id: userId,
      },
    );
  };

  /**
   * Mutes the current user.
   *
   * @param type the type of the mute operation.
   */
  muteSelf = (type: TrackMuteType) => {
    const myUserId = this.currentUserId;
    if (myUserId) {
      return this.muteUser(myUserId, type);
    }
  };

  /**
   * Mutes all the other participants.
   *
   * @param type the type of the mute operation.
   */
  muteOthers = (type: TrackMuteType) => {
    const trackType = muteTypeToTrackType(type);
    if (!trackType) return;
    const userIdsToMute: string[] = [];
    for (const participant of this.state.remoteParticipants) {
      if (participant.publishedTracks.includes(trackType)) {
        userIdsToMute.push(participant.userId);
      }
    }

    return this.muteUser(userIdsToMute, type);
  };

  /**
   * Mutes the user with the given `userId`.
   *
   * @param userId the id of the user to mute.
   * @param type the type of the mute operation.
   */
  muteUser = (userId: string | string[], type: TrackMuteType) => {
    return this.streamClient.post<MuteUsersResponse, MuteUsersRequest>(
      `${this.streamClientBasePath}/mute_users`,
      {
        user_ids: Array.isArray(userId) ? userId : [userId],
        [type]: true,
      },
    );
  };

  /**
   * Will mute all users in the call.
   *
   * @param type the type of the mute operation.
   */
  muteAllUsers = (type: TrackMuteType) => {
    return this.streamClient.post<MuteUsersResponse, MuteUsersRequest>(
      `${this.streamClientBasePath}/mute_users`,
      {
        mute_all_users: true,
        [type]: true,
      },
    );
  };

  /**
   * Starts recording the call
   */
  startRecording = async (request?: StartRecordingRequest) => {
    return this.streamClient.post<
      StartRecordingResponse,
      StartRecordingRequest
    >(`${this.streamClientBasePath}/start_recording`, request ? request : {});
  };

  /**
   * Stops recording the call
   */
  stopRecording = async () => {
    return this.streamClient.post<StopRecordingResponse>(
      `${this.streamClientBasePath}/stop_recording`,
      {},
    );
  };

  /**
   * Starts the transcription of the call.
   *
   * @param request the request data.
   */
  startTranscription = async (
    request?: StartTranscriptionRequest,
  ): Promise<StartTranscriptionResponse> => {
    return this.streamClient.post<
      StartTranscriptionResponse,
      StartTranscriptionRequest
    >(`${this.streamClientBasePath}/start_transcription`, request);
  };

  /**
   * Stops the transcription of the call.
   */
  stopTranscription = async (): Promise<StopTranscriptionResponse> => {
    return this.streamClient.post<StopTranscriptionResponse>(
      `${this.streamClientBasePath}/stop_transcription`,
    );
  };

  /**
   * Sends a `call.permission_request` event to all users connected to the call. The call settings object contains infomration about which permissions can be requested during a call (for example a user might be allowed to request permission to publish audio, but not video).
   */
  requestPermissions = async (
    data: RequestPermissionRequest,
  ): Promise<RequestPermissionResponse> => {
    const { permissions } = data;
    const canRequestPermissions = permissions.every((permission) =>
      this.permissionsContext.canRequest(permission as OwnCapability),
    );
    if (!canRequestPermissions) {
      throw new Error(
        `You are not allowed to request permissions: ${permissions.join(', ')}`,
      );
    }
    return this.streamClient.post<
      RequestPermissionResponse,
      RequestPermissionRequest
    >(`${this.streamClientBasePath}/request_permission`, data);
  };

  /**
   * Allows you to grant certain permissions to a user in a call.
   * The permissions are specific to the call experience and do not survive the call itself.
   *
   * Supported permissions that can be granted are:
   * - `send-audio`
   * - `send-video`
   * - `screenshare`
   *
   * @param userId the id of the user to grant permissions to.
   * @param permissions the permissions to grant.
   */
  grantPermissions = async (userId: string, permissions: string[]) => {
    return this.updateUserPermissions({
      user_id: userId,
      grant_permissions: permissions,
    });
  };

  /**
   * Allows you to revoke certain permissions from a user in a call.
   * The permissions are specific to the call experience and do not survive the call itself.
   *
   * Supported permissions that can be revoked are:
   * - `send-audio`
   * - `send-video`
   * - `screenshare`
   *
   * @param userId the id of the user to revoke permissions from.
   * @param permissions the permissions to revoke.
   */
  revokePermissions = async (userId: string, permissions: string[]) => {
    return this.updateUserPermissions({
      user_id: userId,
      revoke_permissions: permissions,
    });
  };

  /**
   * Allows you to grant or revoke a specific permission to a user in a call. The permissions are specific to the call experience and do not survive the call itself.
   *
   * When revoking a permission, this endpoint will also mute the relevant track from the user. This is similar to muting a user with the difference that the user will not be able to unmute afterwards.
   *
   * Supported permissions that can be granted or revoked: `send-audio`, `send-video` and `screenshare`.
   *
   * `call.permissions_updated` event is sent to all members of the call.
   *
   */
  updateUserPermissions = async (data: UpdateUserPermissionsRequest) => {
    return this.streamClient.post<
      UpdateUserPermissionsResponse,
      UpdateUserPermissionsRequest
    >(`${this.streamClientBasePath}/user_permissions`, data);
  };

  /**
   * Starts the livestreaming of the call.
   *
   * @param data the request data.
   * @param params the request params.
   */
  goLive = async (data: GoLiveRequest = {}, params?: { notify?: boolean }) => {
    return this.streamClient.post<GoLiveResponse, GoLiveRequest>(
      `${this.streamClientBasePath}/go_live`,
      data,
      params,
    );
  };

  /**
   * Stops the livestreaming of the call.
   */
  stopLive = async () => {
    return this.streamClient.post<StopLiveResponse>(
      `${this.streamClientBasePath}/stop_live`,
      {},
    );
  };

  /**
   * Starts the broadcasting of the call.
   */
  startHLS = async () => {
    return this.streamClient.post<StartHLSBroadcastingResponse>(
      `${this.streamClientBasePath}/start_broadcasting`,
      {},
    );
  };

  /**
   * Stops the broadcasting of the call.
   */
  stopHLS = async () => {
    return this.streamClient.post<StopHLSBroadcastingResponse>(
      `${this.streamClientBasePath}/stop_broadcasting`,
      {},
    );
  };

  /**
   * Updates the call settings or custom data.
   *
   * @param updates the updates to apply to the call.
   */
  update = async (updates: UpdateCallRequest) => {
    const response = await this.streamClient.patch<
      UpdateCallResponse,
      UpdateCallRequest
    >(`${this.streamClientBasePath}`, updates);

    const { call, members, own_capabilities } = response;
    this.state.updateFromCallResponse(call);
    this.state.setMembers(members);
    this.state.setOwnCapabilities(own_capabilities);

    return response;
  };

  /**
   * Ends the call. Once the call is ended, it cannot be re-joined.
   */
  endCall = async () => {
    return this.streamClient.post<EndCallResponse>(
      `${this.streamClientBasePath}/mark_ended`,
    );
  };

  /**
   * Pins the given session to the top of the participants list.
   *
   * @param sessionId the sessionId to pin.
   */
  pin = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      pin: {
        isLocalPin: true,
        pinnedAt: Date.now(),
      },
    });
  };

  /**
   * Unpins the given session from the top of the participants list.
   *
   * @param sessionId the sessionId to unpin.
   */
  unpin = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      pin: undefined,
    });
  };

  /**
   * Pins the given session to the top of the participants list for everyone
   * in the call.
   * You can execute this method only if you have the `pin-for-everyone` capability.
   *
   * @param request the request object.
   */
  pinForEveryone = async (request: PinRequest) => {
    return this.streamClient.post<PinResponse, PinRequest>(
      `${this.streamClientBasePath}/pin`,
      request,
    );
  };

  /**
   * Unpins the given session from the top of the participants list for everyone
   * in the call.
   * You can execute this method only if you have the `pin-for-everyone` capability.
   *
   * @param request the request object.
   */
  unpinForEveryone = async (request: UnpinRequest) => {
    return this.streamClient.post<UnpinResponse, UnpinRequest>(
      `${this.streamClientBasePath}/unpin`,
      request,
    );
  };

  /**
   * Query call members with filter query. The result won't be stored in call state.
   * @param request
   * @returns
   */
  queryMembers = (request?: Omit<QueryCallMembersRequest, 'type' | 'id'>) => {
    return this.streamClient.post<
      QueryCallMembersResponse,
      QueryCallMembersRequest
    >('/call/members', {
      ...(request || {}),
      id: this.id,
      type: this.type,
    });
  };

  /**
   * Will update the call members.
   *
   * @param data the request data.
   */
  updateCallMembers = async (
    data: UpdateCallMembersRequest,
  ): Promise<UpdateCallMembersResponse> => {
    return this.streamClient.post<
      UpdateCallMembersResponse,
      UpdateCallMembersRequest
    >(`${this.streamClientBasePath}/members`, data);
  };

  /**
   * Schedules an auto-drop timeout based on the call settings.
   * Applicable only for ringing calls.
   */
  private scheduleAutoDrop = () => {
    clearTimeout(this.dropTimeout);
    this.leaveCallHooks.add(
      createSubscription(this.state.settings$, (settings) => {
        if (!settings) return;
        // ignore if the call is not ringing
        if (this.state.callingState !== CallingState.RINGING) return;

        const timeoutInMs = settings.ring.auto_cancel_timeout_ms;
        // 0 means no auto-drop
        if (timeoutInMs <= 0) return;

        clearTimeout(this.dropTimeout);
        this.dropTimeout = setTimeout(() => {
          this.leave({ reason: 'ring: timeout' }).catch((err) => {
            this.logger('error', 'Failed to drop call', err);
          });
        }, timeoutInMs);
      }),
    );
  };

  /**
   * Retrieves the list of recordings for the current call or call session.
   *
   * If `callSessionId` is provided, it will return the recordings for that call session.
   * Otherwise, all recordings for the current call will be returned.
   *
   * @param callSessionId the call session id to retrieve recordings for.
   */
  queryRecordings = async (
    callSessionId?: string,
  ): Promise<ListRecordingsResponse> => {
    let endpoint = this.streamClientBasePath;
    if (callSessionId) {
      endpoint = `${endpoint}/${callSessionId}`;
    }
    return this.streamClient.get<ListRecordingsResponse>(
      `${endpoint}/recordings`,
    );
  };

  /**
   * Retrieves the list of transcriptions for the current call.
   *
   * @returns the list of transcriptions.
   */
  queryTranscriptions = async (): Promise<ListTranscriptionsResponse> => {
    return this.streamClient.get<ListTranscriptionsResponse>(
      `${this.streamClientBasePath}/transcriptions`,
    );
  };

  /**
   * Retrieve call statistics for a particular call session (historical).
   * Here `callSessionID` is mandatory.
   *
   * @param callSessionID the call session ID to retrieve statistics for.
   * @returns The call stats.
   */
  getCallStats = async (callSessionID: string) => {
    const endpoint = `${this.streamClientBasePath}/stats/${callSessionID}`;
    return this.streamClient.get<GetCallStatsResponse>(endpoint);
  };

  /**
   * Submit user feedback for the call
   *
   * @param rating Rating between 1 and 5 denoting the experience of the user in the call
   * @param reason The reason/description for the rating
   * @param custom Custom data
   * @returns
   */
  submitFeedback = async (
    rating: number,
    {
      reason,
      custom,
    }: {
      reason?: string;
      custom?: Record<string, any>;
    } = {},
  ) => {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const callSessionId = this.state.session?.id;
    if (!callSessionId) {
      throw new Error(
        'Feedback can be submitted only in the context of a call session',
      );
    }

    const { sdkName, sdkVersion, ...platform } =
      getSdkSignature(getClientDetails());

    // user sessionId is not available once the call has been left
    // until we relax the backend validation, we'll send N/A
    const userSessionId = this.sfuClient?.sessionId ?? 'N/A';
    const endpoint = `${this.streamClientBasePath}/feedback/${callSessionId}`;
    return this.streamClient.post<
      CollectUserFeedbackResponse,
      CollectUserFeedbackRequest
    >(endpoint, {
      rating,
      reason,
      user_session_id: userSessionId,
      sdk: sdkName,
      sdk_version: sdkVersion,
      custom: {
        ...custom,
        'x-stream-platform-data': platform,
      },
    });
  };

  /**
   * Sends a custom event to all call participants.
   *
   * @param payload the payload to send.
   */
  sendCustomEvent = async (payload: { [key: string]: any }) => {
    return this.streamClient.post<SendCallEventResponse, SendCallEventRequest>(
      `${this.streamClientBasePath}/event`,
      { custom: payload },
    );
  };

  /**
   * Applies the device configuration from the backend.
   *
   * @internal
   */
  applyDeviceConfig = async () => {
    await this.initCamera({ setStatus: false }).catch((err) => {
      this.logger('warn', 'Camera init failed', err);
    });
    await this.initMic({ setStatus: false }).catch((err) => {
      this.logger('warn', 'Mic init failed', err);
    });
  };

  private async initCamera(options: { setStatus: boolean }) {
    // Wait for any in progress camera operation
    await this.camera.statusChangeSettled();

    if (
      this.state.localParticipant?.videoStream ||
      !this.permissionsContext.hasPermission('send-video')
    ) {
      return;
    }

    // Set camera direction if it's not yet set
    if (!this.camera.state.direction && !this.camera.state.selectedDevice) {
      let defaultDirection: CameraDirection = 'front';
      const backendSetting = this.state.settings?.video.camera_facing;
      if (backendSetting) {
        defaultDirection = backendSetting === 'front' ? 'front' : 'back';
      }
      this.camera.state.setDirection(defaultDirection);
    }

    // Set target resolution
    const targetResolution = this.state.settings?.video.target_resolution;
    if (targetResolution) {
      await this.camera.selectTargetResolution(targetResolution);
    }

    if (options.setStatus) {
      // Publish already that was set before we joined
      if (
        this.camera.state.status === 'enabled' &&
        this.camera.state.mediaStream &&
        !this.publisher?.isPublishing(TrackType.VIDEO)
      ) {
        await this.publishVideoStream(this.camera.state.mediaStream, {
          preferredCodec: this.camera.preferredCodec,
        });
      }

      // Start camera if backend config specifies, and there is no local setting
      if (
        this.camera.state.status === undefined &&
        this.state.settings?.video.camera_default_on
      ) {
        await this.camera.enable();
      }
    }
  }

  private async initMic(options: { setStatus: boolean }) {
    // Wait for any in progress mic operation
    await this.microphone.statusChangeSettled();

    if (
      this.state.localParticipant?.audioStream ||
      !this.permissionsContext.hasPermission('send-audio')
    ) {
      return;
    }

    if (options.setStatus) {
      // Publish media stream that was set before we joined
      if (
        this.microphone.state.status === 'enabled' &&
        this.microphone.state.mediaStream &&
        !this.publisher?.isPublishing(TrackType.AUDIO)
      ) {
        await this.publishAudioStream(this.microphone.state.mediaStream);
      }

      // Start mic if backend config specifies, and there is no local setting
      if (
        this.microphone.state.status === undefined &&
        this.state.settings?.audio.mic_default_on
      ) {
        await this.microphone.enable();
      }
    }
  }

  /**
   * Will begin tracking the given element for visibility changes within the
   * configured viewport element (`call.setViewport`).
   *
   * @param element the element to track.
   * @param sessionId the session id.
   * @param trackType the video mode.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    return this.dynascaleManager.trackElementVisibility(
      element,
      sessionId,
      trackType,
    );
  };

  /**
   * Sets the viewport element to track bound video elements for visibility.
   *
   * @param element the viewport element.
   */
  setViewport = <T extends HTMLElement>(element: T) => {
    return this.dynascaleManager.setViewport(element);
  };

  /**
   * Binds a DOM <video> element to the given session id.
   * This method will make sure that the video element will play
   * the correct video stream for the given session id.
   *
   * Under the hood, it would also keep track of the video element dimensions
   * and update the subscription accordingly in order to optimize the bandwidth.
   *
   * If a "viewport" is configured, the video element will be automatically
   * tracked for visibility and the subscription will be updated accordingly.
   *
   * @param videoElement the video element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of video.
   */
  bindVideoElement = (
    videoElement: HTMLVideoElement,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    const unbind = this.dynascaleManager.bindVideoElement(
      videoElement,
      sessionId,
      trackType,
    );

    if (!unbind) return;
    this.leaveCallHooks.add(unbind);
    return () => {
      this.leaveCallHooks.delete(unbind);
      unbind();
    };
  };

  /**
   * Binds a DOM <audio> element to the given session id.
   *
   * This method will make sure that the audio element will
   * play the correct audio stream for the given session id.
   *
   * @param audioElement the audio element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of audio.
   */
  bindAudioElement = (
    audioElement: HTMLAudioElement,
    sessionId: string,
    trackType: AudioTrackType = 'audioTrack',
  ) => {
    const unbind = this.dynascaleManager.bindAudioElement(
      audioElement,
      sessionId,
      trackType,
    );

    if (!unbind) return;
    this.leaveCallHooks.add(unbind);
    return () => {
      this.leaveCallHooks.delete(unbind);
      unbind();
    };
  };

  /**
   * Binds a DOM <img> element to this call's thumbnail (if enabled in settings).
   *
   * @param imageElement the image element to bind to.
   * @param opts options for the binding.
   */
  bindCallThumbnailElement = (
    imageElement: HTMLImageElement,
    opts: {
      fallbackImageSource?: string;
    } = {},
  ) => {
    const handleError = () => {
      imageElement.src =
        opts.fallbackImageSource ||
        'https://getstream.io/random_svg/?name=x&id=x';
    };

    const unsubscribe = createSubscription(
      this.state.thumbnails$,
      (thumbnails) => {
        if (!thumbnails) return;
        imageElement.addEventListener('error', handleError);

        const thumbnailUrl = new URL(thumbnails.image_url);
        thumbnailUrl.searchParams.set('w', String(imageElement.clientWidth));
        thumbnailUrl.searchParams.set('h', String(imageElement.clientHeight));

        imageElement.src = thumbnailUrl.toString();
      },
    );

    return () => {
      unsubscribe();
      imageElement.removeEventListener('error', handleError);
    };
  };
}
