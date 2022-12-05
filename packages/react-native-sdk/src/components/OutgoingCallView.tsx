import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import PhoneDown from '../icons/PhoneDown';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import Mic from '../icons/Mic';
import MicOff from '../icons/MicOff';
import { RTCView } from 'react-native-webrtc';
import { UserInfoView } from './UserInfoView';
import {
  useActiveCall,
  useActiveRingCall,
  useLocalParticipant,
  useRemoteParticipants,
  useStreamVideoClient,
  useTerminatedRingCall,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import InCallManager from 'react-native-incall-manager';
import { useCallKeep } from '../hooks/useCallKeep';

export type OutgoingCallViewProps = {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
  /**
   * Handler called when the call is accepted by the callee. Mostly used for navigation and related actions.
   */
  onCallAccepted: () => void;
};

const Background: React.FC = () => {
  const localParticipant = useLocalParticipant();
  const localVideoStream = localParticipant?.videoStream;
  const isVideoMuted = !localParticipant?.video;

  if (isVideoMuted)
    return <View style={[StyleSheet.absoluteFill, styles.background]} />;
  return (
    <RTCView
      streamURL={localVideoStream?.toURL()}
      objectFit="cover"
      zOrder={1}
      style={styles.stream}
      mirror={true}
    />
  );
};

export const OutgoingCallView: React.FC<OutgoingCallViewProps> = ({
  onHangupCall,
  onCallAccepted,
}) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const localParticipant = useLocalParticipant();
  const terminatedRingCall = useTerminatedRingCall();
  const activeRingCallMeta = useActiveRingCall();
  const remoteParticipants = useRemoteParticipants();
  const { endCall } = useCallKeep();

  const isAudioMuted = !localParticipant?.audio;
  const isVideoMuted = !localParticipant?.video;

  const hangupHandler = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      if (activeRingCallMeta) {
        await client?.cancelCall(activeRingCallMeta.callCid);
        endCall();
      }
      activeCall.leave();
      InCallManager.stop();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall, activeRingCallMeta, client, endCall]);

  useEffect(() => {
    if (terminatedRingCall) {
      onHangupCall();
    }
    if (remoteParticipants.length > 0) {
      onCallAccepted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminatedRingCall, remoteParticipants]);

  // To terminate call after a certain duration of time. Currently let to 10 seconds.
  useEffect(() => {
    const terminateCallAtMilliSeconds = 10000;
    const timerId = setTimeout(() => {
      hangupHandler();
    }, terminateCallAtMilliSeconds);

    return () => clearTimeout(timerId);
  }, [hangupHandler]);

  const videoToggle = async () => {
    await activeCall?.updateMuteState('video', !isVideoMuted);
  };

  const audioToggle = async () => {
    await activeCall?.updateMuteState('audio', !isAudioMuted);
  };

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <View style={styles.deviceControlButtons}>
            <CallControlsButton
              onPress={audioToggle}
              colorKey={!isAudioMuted ? 'activated' : 'deactivated'}
              style={styles.buttonStyle}
              svgContainerStyle={styles.svgStyle}
            >
              {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#000" />}
            </CallControlsButton>
            <CallControlsButton
              onPress={videoToggle}
              colorKey={!isVideoMuted ? 'activated' : 'deactivated'}
              style={styles.buttonStyle}
              svgContainerStyle={styles.svgStyle}
            >
              {isVideoMuted ? (
                <VideoSlash color="#fff" />
              ) : (
                <Video color="#000" />
              )}
            </CallControlsButton>
          </View>

          <CallControlsButton
            onPress={hangupHandler}
            colorKey={'cancel'}
            style={[styles.buttonStyle, styles.hangupButton]}
            svgContainerStyle={styles.svgStyle}
          >
            <PhoneDown color="#fff" />
          </CallControlsButton>
        </View>
      </View>
      <Background />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 2,
  },
  background: {
    backgroundColor: '#272A30',
  },
  callingText: {
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
  },
  deviceControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  hangupButton: {
    alignSelf: 'center',
  },
  buttonStyle: {
    height: 70,
    width: 70,
    borderRadius: 70,
  },
  svgStyle: {
    height: 30,
    width: 30,
  },
  stream: {
    flex: 1,
  },
});
