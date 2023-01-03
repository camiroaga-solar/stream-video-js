import { Injectable, NgZone } from '@angular/core';
import {
  checkIfAudioOutputChangeSupported,
  createSoundDetector,
  getAudioDevices,
  getAudioOutputDevices,
  getAudioStream,
  getScreenShareStream,
  getVideoDevices,
  getVideoStream,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedAudioOutputDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { BehaviorSubject, map, Observable, ReplaySubject, take } from 'rxjs';

/**
 * `loading` means that a stream is currently being retrieved from the browser
 * `on` means that there is an ongoing media stream
 * `off` means that the user decided to turn off the stream
 * `error` means an error occurred while trying to retrieve a stream (for example the user didn't give permission to use camera/microphone)
 * `initial` is the default state, which means we didn't try to start a stream yet
 */
export type ScreenShareState = 'loading' | 'on' | 'off' | 'error' | 'initial';

/**
 * `disconnected` means the stream is lost due to a device being disconnected/lost
 */
export type MediaStreamState = ScreenShareState | 'disconnected';

/**
 * `detecting-speech-while-muted` means the audio is turned off by the user (audio stream is not transmitted in a call), but we have a local audio stream started in order to detect speech while muted
 */
export type AudioMediaStreamState =
  | MediaStreamState
  | 'detecting-speech-while-muted';

/**
 * This service can be used to list devices (audio input, video input and audio output), start/stop media streams (including screenshare) and switch between devices
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceManagerService {
  /**
   * The list of available `audioinput` devices, if devices are added/removed - the list is updated
   * Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initAudioDevices` for that in order to have full control over when the permission window will be displayed
   */
  audioDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available `videoinput` devices, if devices are added/removed - the list is updated
   * Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initVideoDevices` for that in order to have full control over when the permission window will be displayed
   */
  videoDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * The list of available `audiooutput` devices, if devices are added/removed - the list is updated
   * Since some browsers require permissions for listing the devices the list is not initialized by default, you have to call `initAudioOutputDevices` for that in order to have full control over when the permission window will be displayed
   */
  audioOutputDevices$: Observable<MediaDeviceInfo[]>;
  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId)
   */
  isAudioOutputChangeSupportedByBrowser = checkIfAudioOutputChangeSupported();
  /**
   * The `deviceId` of the currently selected video input device
   */
  videoDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio input device
   */
  audioDevice$: Observable<string | undefined>;
  /**
   * The `deviceId` of the currently selected audio output device
   */
  audioOutputDevice$: Observable<string | undefined>;
  /**
   * Provides detailed information about the video stream, you can use this stream to visually display the state on the UI
   */
  videoState$: Observable<MediaStreamState>;
  /**
   * If `videoState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  videoErrorMessage$: Observable<string | undefined>;
  /**
   * The video media stream, you can start and stop it with the `startVideo` and `stopVideo` methods
   */
  videoStream$: Observable<MediaStream | undefined>;
  /**
   * Provides detailed information about the audio stream, you can use this stream to visually display the state on the UI
   */
  audioState$: Observable<AudioMediaStreamState>;
  /**
   * If `audioState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  audioErrorMessage$: Observable<string | undefined>;
  /**
   * The audio media stream, you can start and stop it with the `startAudio` and `stopAudio` methods
   */
  audioStream$: Observable<MediaStream | undefined>;
  /**
   * `true` if `audioState$` is `on` or `detecting-speech-while-muted`, and detected audio levels suggest that the user is currently speaking
   */
  isSpeaking$: Observable<boolean>;
  /**
   * Provides detailed information about the screenshare stream, you can use this stream to visually display the state on the UI
   */
  screenShareState$: Observable<ScreenShareState>;
  /**
   * If `screenShareState$` is `error` this stream emits the error message, so additional explanation can be provided to users
   */
  screenShareErrorMessage$: Observable<string | undefined>;
  /**
   * The screenshare media stream, you can start and stop it with the `startScreenShare` and `stopScreenShare` methods
   */
  screenShareStream$: Observable<MediaStream | undefined>;
  private videoStateSubject = new BehaviorSubject<MediaStreamState>('initial');
  private videoErrorMessageSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private videoStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  private audioStateSubject = new BehaviorSubject<AudioMediaStreamState>(
    'initial',
  );
  private audioErrorMessageSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private audioStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  private isSpeakingSubject = new BehaviorSubject<boolean>(false);
  private audioOutputDeviceSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  private disposeSoundDetector?: () => Promise<void>;
  private audioDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private videoDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private audioOutputDevicesSubject = new ReplaySubject<MediaDeviceInfo[]>(1);
  private screenShareStateSubject = new BehaviorSubject<ScreenShareState>(
    'initial',
  );
  private screenShareErrorMessageSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private screenShareStreamSubject = new BehaviorSubject<
    MediaStream | undefined
  >(undefined);

  constructor(private ngZone: NgZone) {
    this.videoState$ = this.videoStateSubject.asObservable();
    this.videoErrorMessage$ = this.videoErrorMessageSubject.asObservable();
    this.videoStream$ = this.videoStreamSubject.asObservable();
    this.audioState$ = this.audioStateSubject.asObservable();
    this.audioErrorMessage$ = this.audioErrorMessageSubject.asObservable();
    this.audioStream$ = this.audioStreamSubject.asObservable();
    this.isSpeaking$ = this.isSpeakingSubject.asObservable();
    this.audioOutputDevice$ = this.audioOutputDeviceSubject.asObservable();

    this.videoDevice$ = this.videoStream$.pipe(
      map((stream) => {
        if (stream) {
          return stream.getVideoTracks()[0].getCapabilities()
            .deviceId as string;
        } else {
          return undefined;
        }
      }),
    );

    this.audioDevice$ = this.audioStream$.pipe(
      map((stream) => {
        if (stream) {
          return stream.getAudioTracks()[0].getCapabilities()
            .deviceId as string;
        } else {
          return undefined;
        }
      }),
    );

    this.audioDevices$ = this.audioDevicesSubject.asObservable();
    this.videoDevices$ = this.videoDevicesSubject.asObservable();
    this.audioOutputDevices$ = this.audioOutputDevicesSubject.asObservable();

    this.audioOutputDevices$
      .pipe(take(1))
      .subscribe((devices) =>
        this.audioOutputDeviceSubject.next(devices[0].deviceId),
      );

    this.screenShareState$ = this.screenShareStateSubject.asObservable();
    this.screenShareStream$ = this.screenShareStreamSubject.asObservable();
    this.screenShareErrorMessage$ =
      this.screenShareErrorMessageSubject.asObservable();
  }

  initAudioDevices() {
    getAudioDevices().subscribe(this.audioDevicesSubject);

    watchForDisconnectedAudioDevice(this.audioDevice$).subscribe(() => {
      this.audioStateSubject.next('disconnected');
    });
  }

  initVideoDevices() {
    getVideoDevices().subscribe(this.videoDevicesSubject);

    watchForDisconnectedVideoDevice(this.videoDevice$).subscribe(() => {
      this.videoStateSubject.next('disconnected');
    });
  }

  initAudioOutputDevices() {
    getAudioOutputDevices().subscribe(this.audioOutputDevicesSubject);

    watchForDisconnectedAudioOutputDevice(this.audioOutputDevice$).subscribe(
      () => {
        this.audioOutputDeviceSubject.next(undefined);
      },
    );
  }

  get audioState() {
    return this.audioStateSubject.getValue();
  }

  get audioStream() {
    return this.audioStreamSubject.getValue();
  }

  get videoState() {
    return this.videoStateSubject.getValue();
  }

  get videoStream() {
    return this.videoStreamSubject.getValue();
  }

  get screenShareState() {
    return this.screenShareStateSubject.getValue();
  }

  get screenShareStream() {
    return this.screenShareStreamSubject.getValue();
  }

  toggleVideo() {
    if (this.videoState === 'off' || this.videoState === 'initial') {
      this.startVideo();
    } else if (this.videoState === 'on') {
      this.stopVideo();
    }
  }

  toggleAudio() {
    if (this.audioState === 'off' || this.audioState === 'initial') {
      this.startAudio();
    } else if (this.audioState === 'on') {
      this.stopAudio();
    } else if (this.audioState === 'detecting-speech-while-muted') {
      this.audioStateSubject.next('on');
    }
  }

  toggleScreenShare() {
    if (
      this.screenShareState === 'off' ||
      this.screenShareState === 'initial'
    ) {
      this.startScreenShare();
    } else if (this.screenShareState === 'on') {
      this.stopScreenShare();
    }
  }

  startVideo(deviceId?: string) {
    this.videoStateSubject.next('loading');
    getVideoStream(deviceId)
      .then((s) => {
        this.stopVideo();
        this.videoStreamSubject.next(s);
        this.videoStateSubject.next('on');
      })
      .catch((err) => {
        if (err.code === 0) {
          this.videoErrorMessageSubject.next(
            'Permission denied for camera access',
          );
        } else {
          this.videoErrorMessageSubject.next(
            `Video stream couldn't be started`,
          );
        }
        this.videoStateSubject.next('error');
      });
  }

  stopVideo() {
    if (!this.videoStream) {
      return;
    }
    this.videoStream.getTracks().forEach((t) => t.stop());
    this.videoStreamSubject.next(undefined);
    this.videoStateSubject.next('off');
  }

  /**
   *
   * @param deviceId
   * @param isSilent if `true` `audioState$` will be `detecting-speech-while-muted` instead of `on` after stream is started
   */
  startAudio(deviceId?: string, isSilent = false) {
    this.audioStateSubject.next('loading');
    getAudioStream(deviceId)
      .then((audioStream) => {
        this.stopAudio();
        this.audioStreamSubject.next(audioStream);
        this.disposeSoundDetector = this.ngZone.runOutsideAngular(() => {
          return createSoundDetector(audioStream, (isSpeechDetected) => {
            if (isSpeechDetected !== this.isSpeakingSubject.getValue()) {
              this.ngZone.run(() => {
                this.isSpeakingSubject.next(isSpeechDetected);
              });
            }
          });
        });
        this.audioStateSubject.next(
          isSilent ? 'detecting-speech-while-muted' : 'on',
        );
      })
      .catch((err) => {
        if (err.code === 0) {
          this.audioErrorMessageSubject.next(
            'Permission denied for camera access',
          );
        } else {
          this.audioErrorMessageSubject.next(
            `Video stream couldn't be started`,
          );
        }
        this.audioStateSubject.next('error');
      });
  }

  stopAudio() {
    if (!this.audioStream) {
      return;
    }
    this.audioStream.getTracks().forEach((t) => t.stop());
    this.disposeSoundDetector?.();
    this.audioStreamSubject.next(undefined);
    this.audioStateSubject.next('off');
  }

  startScreenShare() {
    this.screenShareStateSubject.next('loading');
    getScreenShareStream()
      .then((s) => {
        this.stopScreenShare();
        this.screenShareStreamSubject.next(s);
        this.screenShareStateSubject.next('on');
      })
      .catch(() => {
        this.screenShareErrorMessageSubject.next(
          `Screen share stream couldn't be started`,
        );
        this.screenShareStateSubject.next('error');
      });
  }

  stopScreenShare() {
    if (!this.screenShareStream) {
      return;
    }
    this.screenShareStream.getTracks().forEach((t) => t.stop());
    this.screenShareStreamSubject.next(undefined);
    this.screenShareStateSubject.next('off');
  }

  selectAudioOutput(deviceId: string | undefined) {
    this.audioOutputDeviceSubject.next(deviceId);
  }
}
