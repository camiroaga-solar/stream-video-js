import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  useCall,
  CallContent,
  useTheme,
  useIsInPiPMode,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import { BottomControls } from './CallControlls/BottomControls';
import { useOrientation } from '../hooks/useOrientation';
import { Z_INDEX } from '../constants';
import { TopControls } from './CallControlls/TopControls';
import { useLayout } from '../contexts/LayoutContext';
import { useToggleCallRecording } from '@stream-io/video-react-bindings';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

type ActiveCallProps = {
  onHangupCallHandler?: () => void;
  onCallEnded: () => void;
  onChatOpenHandler: () => void;
  unreadCountIndicator: number;
};

export const ActiveCall = ({
  onChatOpenHandler,
  onHangupCallHandler,
  onCallEnded,
  unreadCountIndicator,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();
  const currentOrientation = useOrientation();
  const styles = useStyles();
  const { selectedLayout } = useLayout();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const isInPiPMode = useIsInPiPMode(false);

  const onOpenCallParticipantsInfo = useCallback(() => {
    setIsCallParticipantsVisible(true);
  }, []);

  useEffect(() => {
    return call?.on('call.ended', () => {
      onCallEnded();
    });
  }, [call, onCallEnded]);

  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } =
    useToggleCallRecording();

  const CustomBottomControls = useCallback(() => {
    return (
      <BottomControls
        onParticipantInfoPress={onOpenCallParticipantsInfo}
        onChatOpenHandler={onChatOpenHandler}
        unreadCountIndicator={unreadCountIndicator}
        toggleCallRecording={toggleCallRecording}
        isCallRecordingInProgress={isCallRecordingInProgress}
        isAwaitingResponse={isAwaitingResponse}
      />
    );
  }, [
    onChatOpenHandler,
    onOpenCallParticipantsInfo,
    unreadCountIndicator,
    toggleCallRecording,
    isAwaitingResponse,
    isCallRecordingInProgress,
  ]);

  const CustomTopControls = useCallback(() => {
    return (
      <TopControls
        isAwaitingResponse={isAwaitingResponse}
        isCallRecordingInProgress={isCallRecordingInProgress}
        onHangupCallHandler={onHangupCallHandler}
      />
    );
  }, [isAwaitingResponse, isCallRecordingInProgress, onHangupCallHandler]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
      />
      {!isInPiPMode && <CustomTopControls />}
      <CallContent
        onHangupCallHandler={onHangupCallHandler}
        CallControls={CustomBottomControls}
        landscape={currentOrientation === 'landscape'}
        layout={selectedLayout}
      />
      <ParticipantsInfoList
        isCallParticipantsInfoVisible={isCallParticipantsVisible}
        setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
      />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingTop: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
        },
        callContent: { flex: 1 },
        topUnsafeArea: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
          zIndex: Z_INDEX.IN_FRONT,
        },
        bottomUnsafeArea: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: theme.variants.insets.bottom,
          backgroundColor: theme.colors.sheetPrimary,
        },
        leftUnsafeArea: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: theme.variants.insets.left,
          backgroundColor: theme.colors.sheetPrimary,
        },
        rightUnsafeArea: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: theme.variants.insets.right,
          backgroundColor: theme.colors.sheetPrimary,
        },
        view: {
          ...StyleSheet.absoluteFillObject,
          zIndex: Z_INDEX.IN_FRONT,
        },
      }),
    [theme],
  );
};
