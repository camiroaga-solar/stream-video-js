import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Call,
  StreamVideoParticipant,
  SfuModels,
} from '@stream-io/video-client';
import { pairwise, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss'],
})
export class ParticipantComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() kind: 'screen' | 'video' = 'video';
  @Input() participant?: StreamVideoParticipant;
  call?: Call;
  isProfileImageError = false;
  connectionQuality?: string;
  @ViewChild('video')
  private videoElement!: ElementRef<HTMLElement>;
  @ViewChild('audio')
  private audioElement!: ElementRef<HTMLMediaElement>;
  private resizeObserver: ResizeObserver | undefined;
  private isViewInited = false;
  @HostBinding() class = 'str-video__participant-angular-host';
  private subscriptions: Subscription[] = [];

  TrackType = SfuModels.TrackType;

  constructor(private streamVideoService: StreamVideoService) {
    this.streamVideoService.activeCall$.subscribe((c) => (this.call = c));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['participant']?.previousValue?.isLoggedInUser &&
      !changes['participant']?.currentValue?.isLoggedInUser &&
      this.isViewInited &&
      this.isPublishingTrack
    ) {
      this.registerResizeObserver();
    }
    if (changes['participant'] && this.participant) {
      this.connectionQuality = String(
        SfuModels.ConnectionQuality[this.participant.connectionQuality],
      ).toLowerCase();
    }
    if (
      changes['participant'] &&
      changes['participant']?.previousValue?.sessionId !==
        changes['participant']?.currentValue?.sessionId
    ) {
      this.isProfileImageError = false;
    }
  }

  ngAfterViewInit(): void {
    this.isViewInited = true;
    if (!this.participant?.isLoggedInUser && this.isPublishingTrack) {
      this.registerResizeObserver();
    }
    this.subscriptions.push(
      this.streamVideoService.localParticipant$
        .pipe(pairwise())
        .subscribe(([prevParticipant, participant]) => {
          if (
            prevParticipant?.audioOutputDeviceId !==
            participant?.audioOutputDeviceId
          ) {
            (this.audioElement.nativeElement as any).setSinkId(
              participant?.audioOutputDeviceId || '',
            );
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get isPublishingTrack() {
    return this.participant?.publishedTracks.includes(
      this.kind === 'screen'
        ? SfuModels.TrackType.SCREEN_SHARE
        : SfuModels.TrackType.VIDEO,
    );
  }

  private registerResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = new ResizeObserver(() =>
      this.updateTrackSubscriptions(),
    );
    this.resizeObserver.observe(this.videoElement!.nativeElement);
  }

  private updateTrackSubscriptions() {
    this.call?.updateSubscriptionsPartial(this.kind, {
      [this.participant?.sessionId || '']: {
        dimension: this.videoDimension,
      },
    });
  }

  private get videoDimension(): SfuModels.VideoDimension {
    const element = this.videoElement!.nativeElement;
    return { width: element.clientWidth, height: element.clientHeight };
  }
}
