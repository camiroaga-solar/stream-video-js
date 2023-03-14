import { useLocalParticipant, useStore } from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useRef } from 'react';
import {
  Call,
  disposeOfMediaStream,
  getAudioStream,
  SfuModels,
  watchForDisconnectedAudioDevice,
} from '@stream-io/video-client';
import { map } from 'rxjs';

export type AudioPublisherInit = {
  call?: Call;
  initialAudioMuted?: boolean;
  audioDeviceId?: string;
};

export const useAudioPublisher = ({
  call,
  initialAudioMuted,
  audioDeviceId,
}: AudioPublisherInit) => {
  const { localParticipant$ } = useStore();
  const localParticipant = useLocalParticipant();

  // helper reference to determine initial publishing of the media stream
  const initialPublishExecuted = useRef<boolean>(false);
  const participant = useLocalParticipant();

  const isPublishingAudio = participant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const publishAudioStream = useCallback(async () => {
    if (!call) return;
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  useEffect(() => {
    let interrupted = false;

    if (!call && initialPublishExecuted.current) {
      initialPublishExecuted.current = false;
    }

    if (
      !call ||
      // FIXME: remove "&& !initialPublishExecuted.current" and make
      // sure initialAudioMuted is not changing during active call
      (initialAudioMuted && !initialPublishExecuted.current) ||
      (!isPublishingAudio && initialPublishExecuted.current)
    ) {
      return;
    }

    getAudioStream(audioDeviceId).then((stream) => {
      if (interrupted) {
        return disposeOfMediaStream(stream);
      }

      initialPublishExecuted.current = true;
      return call.publishAudioStream(stream);
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.AUDIO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, audioDeviceId]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      localParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      if (!call) return;
      call.setAudioDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  useEffect(() => {
    if (!localParticipant?.audioStream || !call || !isPublishingAudio) return;

    const [track] = localParticipant.audioStream.getAudioTracks();

    const handleTrackEnded = async () => {
      const endedTrackDeviceId = track.getSettings().deviceId;
      if (endedTrackDeviceId === audioDeviceId) {
        const audioStream = await getAudioStream(audioDeviceId);
        await call.publishAudioStream(audioStream);
      }
    };
    track.addEventListener('ended', handleTrackEnded);

    return () => {
      track.removeEventListener('ended', handleTrackEnded);
    };
  }, [audioDeviceId, call, localParticipant?.audioStream, isPublishingAudio]);

  return publishAudioStream;
};
