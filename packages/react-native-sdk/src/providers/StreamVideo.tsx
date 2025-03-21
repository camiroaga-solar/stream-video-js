import {
  type StreamI18nProviderProps,
  type StreamVideoProps,
  StreamVideoProvider,
} from '@stream-io/video-react-bindings';
import React, { type PropsWithChildren, useEffect } from 'react';
import { StreamVideoStoreProvider } from '../contexts/StreamVideoContext';
import NetInfo from '@react-native-community/netinfo';
import { usePushRegisterEffect } from '../hooks';
import { translations } from '../translations';
import { type DeepPartial, ThemeProvider } from '../contexts/ThemeContext';
import { type Theme } from '../theme/theme';

/**
 *
 * @param props
 * @returns
 *
 * @category Client State
 */
export const StreamVideo = (
  props: PropsWithChildren<
    StreamVideoProps &
      StreamI18nProviderProps & {
        style?: DeepPartial<Theme>;
      }
  >,
) => {
  const {
    client,
    children,
    translationsOverrides = translations,
    i18nInstance,
    language,
    style,
  } = props;

  /**
   * Effect to inform the coordinator about the online status of the app
   */
  useEffect(() => {
    let prevIsOnline = true;
    return NetInfo.addEventListener((state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected === true && isInternetReachable !== false;
      if (isOnline === prevIsOnline) {
        return;
      }
      prevIsOnline = isOnline;
      const type = isOnline ? 'online' : 'offline';
      client.streamClient.updateNetworkConnectionStatus({ type });
    });
  }, [client]);

  return (
    <StreamVideoProvider
      client={client}
      language={language}
      translationsOverrides={translationsOverrides}
      i18nInstance={i18nInstance}
    >
      <ThemeProvider style={style}>
        <StreamVideoStoreProvider>
          <PushRegister />
          {children}
        </StreamVideoStoreProvider>
      </ThemeProvider>
    </StreamVideoProvider>
  );
};

/**
 * The usePushRegisterEffect needs to be a child of StreamVideoStoreProvider
 * So we create a renderless component to use it
 */
const PushRegister = () => {
  usePushRegisterEffect();
  return null;
};
