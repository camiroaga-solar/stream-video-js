 
// @generated by protobuf-ts 2.9.5 with parameter long_type_string,client_generic,server_none,eslint_disable,optimize_code_size
// @generated from protobuf file "video/sfu/signal_rpc/signal.proto" (package "stream.video.sfu.signal", syntax proto3)
// tslint:disable
import type {
  RpcOptions,
  RpcTransport,
  ServiceInfo,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import { stackIntercept } from '@protobuf-ts/runtime-rpc';
import type {
  ICERestartRequest,
  ICERestartResponse,
  ICETrickleResponse,
  SendAnswerRequest,
  SendAnswerResponse,
  SendStatsRequest,
  SendStatsResponse,
  SetPublisherRequest,
  SetPublisherResponse,
  StartNoiseCancellationRequest,
  StartNoiseCancellationResponse,
  StopNoiseCancellationRequest,
  StopNoiseCancellationResponse,
  UpdateMuteStatesRequest,
  UpdateMuteStatesResponse,
  UpdateSubscriptionsRequest,
  UpdateSubscriptionsResponse,
} from './signal';
import { SignalServer } from './signal';
import type { ICETrickle } from '../models/models';

/**
 * @generated from protobuf service stream.video.sfu.signal.SignalServer
 */
export interface ISignalServerClient {
  /**
   * SetPublisher sends the WebRTC offer for the peer connection used to publish A/V
   *
   * @generated from protobuf rpc: SetPublisher(stream.video.sfu.signal.SetPublisherRequest) returns (stream.video.sfu.signal.SetPublisherResponse);
   */
  setPublisher(
    input: SetPublisherRequest,
    options?: RpcOptions,
  ): UnaryCall<SetPublisherRequest, SetPublisherResponse>;
  /**
   * answer is sent by the client to the SFU after receiving a subscriber_offer.
   *
   * @generated from protobuf rpc: SendAnswer(stream.video.sfu.signal.SendAnswerRequest) returns (stream.video.sfu.signal.SendAnswerResponse);
   */
  sendAnswer(
    input: SendAnswerRequest,
    options?: RpcOptions,
  ): UnaryCall<SendAnswerRequest, SendAnswerResponse>;
  /**
   * SendICECandidate sends an ICE candidate to the client
   *
   * @generated from protobuf rpc: IceTrickle(stream.video.sfu.models.ICETrickle) returns (stream.video.sfu.signal.ICETrickleResponse);
   */
  iceTrickle(
    input: ICETrickle,
    options?: RpcOptions,
  ): UnaryCall<ICETrickle, ICETrickleResponse>;
  /**
   * UpdateSubscribers is used to notify the SFU about the list of video subscriptions
   * TODO: sync subscriptions based on this + update tracks using the dimension info sent by the user
   *
   * @generated from protobuf rpc: UpdateSubscriptions(stream.video.sfu.signal.UpdateSubscriptionsRequest) returns (stream.video.sfu.signal.UpdateSubscriptionsResponse);
   */
  updateSubscriptions(
    input: UpdateSubscriptionsRequest,
    options?: RpcOptions,
  ): UnaryCall<UpdateSubscriptionsRequest, UpdateSubscriptionsResponse>;
  /**
   * @generated from protobuf rpc: UpdateMuteStates(stream.video.sfu.signal.UpdateMuteStatesRequest) returns (stream.video.sfu.signal.UpdateMuteStatesResponse);
   */
  updateMuteStates(
    input: UpdateMuteStatesRequest,
    options?: RpcOptions,
  ): UnaryCall<UpdateMuteStatesRequest, UpdateMuteStatesResponse>;
  /**
   * @generated from protobuf rpc: IceRestart(stream.video.sfu.signal.ICERestartRequest) returns (stream.video.sfu.signal.ICERestartResponse);
   */
  iceRestart(
    input: ICERestartRequest,
    options?: RpcOptions,
  ): UnaryCall<ICERestartRequest, ICERestartResponse>;
  /**
   * @generated from protobuf rpc: SendStats(stream.video.sfu.signal.SendStatsRequest) returns (stream.video.sfu.signal.SendStatsResponse);
   */
  sendStats(
    input: SendStatsRequest,
    options?: RpcOptions,
  ): UnaryCall<SendStatsRequest, SendStatsResponse>;
  /**
   * @generated from protobuf rpc: StartNoiseCancellation(stream.video.sfu.signal.StartNoiseCancellationRequest) returns (stream.video.sfu.signal.StartNoiseCancellationResponse);
   */
  startNoiseCancellation(
    input: StartNoiseCancellationRequest,
    options?: RpcOptions,
  ): UnaryCall<StartNoiseCancellationRequest, StartNoiseCancellationResponse>;
  /**
   * @generated from protobuf rpc: StopNoiseCancellation(stream.video.sfu.signal.StopNoiseCancellationRequest) returns (stream.video.sfu.signal.StopNoiseCancellationResponse);
   */
  stopNoiseCancellation(
    input: StopNoiseCancellationRequest,
    options?: RpcOptions,
  ): UnaryCall<StopNoiseCancellationRequest, StopNoiseCancellationResponse>;
}
/**
 * @generated from protobuf service stream.video.sfu.signal.SignalServer
 */
export class SignalServerClient implements ISignalServerClient, ServiceInfo {
  typeName = SignalServer.typeName;
  methods = SignalServer.methods;
  options = SignalServer.options;
  constructor(private readonly _transport: RpcTransport) {}
  /**
   * SetPublisher sends the WebRTC offer for the peer connection used to publish A/V
   *
   * @generated from protobuf rpc: SetPublisher(stream.video.sfu.signal.SetPublisherRequest) returns (stream.video.sfu.signal.SetPublisherResponse);
   */
  setPublisher(
    input: SetPublisherRequest,
    options?: RpcOptions,
  ): UnaryCall<SetPublisherRequest, SetPublisherResponse> {
    const method = this.methods[0],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<SetPublisherRequest, SetPublisherResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * answer is sent by the client to the SFU after receiving a subscriber_offer.
   *
   * @generated from protobuf rpc: SendAnswer(stream.video.sfu.signal.SendAnswerRequest) returns (stream.video.sfu.signal.SendAnswerResponse);
   */
  sendAnswer(
    input: SendAnswerRequest,
    options?: RpcOptions,
  ): UnaryCall<SendAnswerRequest, SendAnswerResponse> {
    const method = this.methods[1],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<SendAnswerRequest, SendAnswerResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * SendICECandidate sends an ICE candidate to the client
   *
   * @generated from protobuf rpc: IceTrickle(stream.video.sfu.models.ICETrickle) returns (stream.video.sfu.signal.ICETrickleResponse);
   */
  iceTrickle(
    input: ICETrickle,
    options?: RpcOptions,
  ): UnaryCall<ICETrickle, ICETrickleResponse> {
    const method = this.methods[2],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<ICETrickle, ICETrickleResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * UpdateSubscribers is used to notify the SFU about the list of video subscriptions
   * TODO: sync subscriptions based on this + update tracks using the dimension info sent by the user
   *
   * @generated from protobuf rpc: UpdateSubscriptions(stream.video.sfu.signal.UpdateSubscriptionsRequest) returns (stream.video.sfu.signal.UpdateSubscriptionsResponse);
   */
  updateSubscriptions(
    input: UpdateSubscriptionsRequest,
    options?: RpcOptions,
  ): UnaryCall<UpdateSubscriptionsRequest, UpdateSubscriptionsResponse> {
    const method = this.methods[3],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<
      UpdateSubscriptionsRequest,
      UpdateSubscriptionsResponse
    >('unary', this._transport, method, opt, input);
  }
  /**
   * @generated from protobuf rpc: UpdateMuteStates(stream.video.sfu.signal.UpdateMuteStatesRequest) returns (stream.video.sfu.signal.UpdateMuteStatesResponse);
   */
  updateMuteStates(
    input: UpdateMuteStatesRequest,
    options?: RpcOptions,
  ): UnaryCall<UpdateMuteStatesRequest, UpdateMuteStatesResponse> {
    const method = this.methods[4],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<UpdateMuteStatesRequest, UpdateMuteStatesResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * @generated from protobuf rpc: IceRestart(stream.video.sfu.signal.ICERestartRequest) returns (stream.video.sfu.signal.ICERestartResponse);
   */
  iceRestart(
    input: ICERestartRequest,
    options?: RpcOptions,
  ): UnaryCall<ICERestartRequest, ICERestartResponse> {
    const method = this.methods[5],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<ICERestartRequest, ICERestartResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * @generated from protobuf rpc: SendStats(stream.video.sfu.signal.SendStatsRequest) returns (stream.video.sfu.signal.SendStatsResponse);
   */
  sendStats(
    input: SendStatsRequest,
    options?: RpcOptions,
  ): UnaryCall<SendStatsRequest, SendStatsResponse> {
    const method = this.methods[6],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<SendStatsRequest, SendStatsResponse>(
      'unary',
      this._transport,
      method,
      opt,
      input,
    );
  }
  /**
   * @generated from protobuf rpc: StartNoiseCancellation(stream.video.sfu.signal.StartNoiseCancellationRequest) returns (stream.video.sfu.signal.StartNoiseCancellationResponse);
   */
  startNoiseCancellation(
    input: StartNoiseCancellationRequest,
    options?: RpcOptions,
  ): UnaryCall<StartNoiseCancellationRequest, StartNoiseCancellationResponse> {
    const method = this.methods[7],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<
      StartNoiseCancellationRequest,
      StartNoiseCancellationResponse
    >('unary', this._transport, method, opt, input);
  }
  /**
   * @generated from protobuf rpc: StopNoiseCancellation(stream.video.sfu.signal.StopNoiseCancellationRequest) returns (stream.video.sfu.signal.StopNoiseCancellationResponse);
   */
  stopNoiseCancellation(
    input: StopNoiseCancellationRequest,
    options?: RpcOptions,
  ): UnaryCall<StopNoiseCancellationRequest, StopNoiseCancellationResponse> {
    const method = this.methods[8],
      opt = this._transport.mergeOptions(options);
    return stackIntercept<
      StopNoiseCancellationRequest,
      StopNoiseCancellationResponse
    >('unary', this._transport, method, opt, input);
  }
}
