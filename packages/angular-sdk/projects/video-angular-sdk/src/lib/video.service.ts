import { Injectable } from '@angular/core';
import {
  Call,
  StreamVideoClient,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  UserInput,
} from '@stream-io/video-client';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamVideoService {
  user$: Observable<UserInput | undefined>;
  activeCall$: Observable<Call | undefined>;
  pendingCalls$: Observable<Call[]>;
  activeCallAllParticipants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  activeCallLocalParticipant$: Observable<
    StreamVideoLocalParticipant | undefined
  >;
  videoClient: StreamVideoClient | undefined;
  private userSubject: ReplaySubject<UserInput | undefined> = new ReplaySubject(
    1,
  );
  private activeCallSubject: ReplaySubject<Call | undefined> =
    new ReplaySubject(1);
  private pendingCallsSubject: ReplaySubject<Call[]> = new ReplaySubject(1);
  private activeCallAllParticipantsSubject: ReplaySubject<
    StreamVideoParticipant[]
  > = new ReplaySubject(1);
  private activeCallRemoteParticipantsSubject: ReplaySubject<
    StreamVideoParticipant[]
  > = new ReplaySubject(1);
  private activeCallLocalParticipantSubject: ReplaySubject<
    StreamVideoParticipant | undefined
  > = new ReplaySubject(1);
  private subscriptions: Subscription[] = [];

  constructor() {
    this.user$ = this.userSubject.asObservable();
    this.activeCall$ = this.activeCallSubject.asObservable();
    this.pendingCalls$ = this.pendingCallsSubject.asObservable();
    this.activeCallAllParticipants$ =
      this.activeCallAllParticipantsSubject.asObservable();
    this.activeCallRemoteParticipants$ =
      this.activeCallRemoteParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ =
      this.activeCallLocalParticipantSubject.asObservable();
  }

  init(
    apiKey: string,
    token: string,
    baseCoordinatorUrl: string,
    baseWsUrl: string,
  ) {
    if (this.videoClient) {
      console.warn(
        `Multiple init calls detected, this is usually unnecessary, make sure you know what you're doing`,
      );
      this.videoClient.disconnect();
      this.subscriptions.forEach((s) => s.unsubscribe());
    }
    this.videoClient = new StreamVideoClient(apiKey, {
      coordinatorRpcUrl: baseCoordinatorUrl,
      coordinatorWsUrl: baseWsUrl,
      sendJson: true,
      token,
    });

    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.connectedUser$.subscribe(
        this.userSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCall$.subscribe(
        this.activeCallSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.pendingCalls$.subscribe(
        this.pendingCallsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallAllParticipants$.subscribe(
        this.activeCallAllParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallRemoteParticipants$.subscribe(
        this.activeCallRemoteParticipantsSubject,
      ),
    );
    this.subscriptions.push(
      this.videoClient.readOnlyStateStore?.activeCallLocalParticipant$.subscribe(
        this.activeCallLocalParticipantSubject,
      ),
    );

    return this.videoClient;
  }
}
