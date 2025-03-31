import { useEffect, useState } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type LocalDevicePreference = {
  selectedDeviceId: string;
  selectedDeviceLabel: string;
  muted?: boolean;
};

export type LocalDevicePreferences = {
  // Array is preference history with latest preferences first.
  // Single preference still acceptable for backwards compatibility.
  [type in DeviceKey]?: LocalDevicePreference | LocalDevicePreference[];
};

type DeviceKey = 'microphone' | 'camera' | 'speaker';

type DeviceState<K extends DeviceKey> = {
  [ManagerKey in K]: DeviceManagerLike;
} & {
  isMute?: boolean;
  devices: MediaDeviceInfo[];
  selectedDevice: string | undefined;
};

interface DeviceManagerLike {
  state: { selectedDevice: string | undefined };
  select(deviceId: string): Promise<void> | void;
}

const defaultDevice = 'default';

/**
 * This hook will apply and persist the device preferences from local storage.
 *
 * @param key the key to use for local storage.
 */
export const usePersistedDevicePreferences = (
  key: string = '@stream-io/device-preferences',
): void => {
  const { useCameraState, useMicrophoneState, useSpeakerState } =
    useCallStateHooks();
  usePersistedDevicePreference(key, 'camera', useCameraState());
  usePersistedDevicePreference(key, 'microphone', useMicrophoneState());
  usePersistedDevicePreference(key, 'speaker', useSpeakerState());
};

const usePersistedDevicePreference = <K extends DeviceKey>(
  key: string,
  deviceKey: K,
  state: DeviceState<K>,
): void => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [applyingState, setApplyingState] = useState<
    'idle' | 'applying' | 'applied'
  >('idle');
  const manager = state[deviceKey];

  useEffect(
    function apply() {
      if (
        callingState === CallingState.LEFT ||
        !state.devices?.length ||
        applyingState !== 'idle'
      ) {
        return;
      }

      const preferences = parseLocalDevicePreferences(key);
      const preference = preferences[deviceKey];

      setApplyingState('applying');

      if (preference && !manager.state.selectedDevice) {
        selectDevice(manager, [preference].flat(), state.devices)
          .catch((err) => {
            console.warn(`Failed to save ${deviceKey} device preferences`, err);
          })
          .finally(() => setApplyingState('applied'));
      } else {
        setApplyingState('applied');
      }
    },
    [applyingState, callingState, deviceKey, key, manager, state.devices],
  );

  useEffect(
    function persist() {
      if (
        callingState === CallingState.LEFT ||
        !state.devices?.length ||
        applyingState !== 'applied'
      ) {
        return;
      }

      try {
        patchLocalDevicePreference(key, deviceKey, {
          devices: state.devices,
          selectedDevice: state.selectedDevice,
          isMute: state.isMute,
        });
      } catch (err) {
        console.warn(`Failed to save ${deviceKey} device preferences`, err);
      }
    },
    [
      applyingState,
      callingState,
      deviceKey,
      key,
      state.devices,
      state.isMute,
      state.selectedDevice,
    ],
  );
};

const parseLocalDevicePreferences = (key: string): LocalDevicePreferences => {
  const preferencesStr = window.localStorage.getItem(key);
  let preferences: LocalDevicePreferences = {};

  if (preferencesStr) {
    try {
      preferences = JSON.parse(preferencesStr);

      if (Object.hasOwn(preferences, 'mic')) {
        // for backwards compatibility
        preferences.microphone = (
          preferences as { mic: LocalDevicePreference }
        ).mic;
      }
    } catch {
      /* assume preferences are empty */
    }
  }

  return preferences;
};

const patchLocalDevicePreference = (
  key: string,
  deviceKey: DeviceKey,
  state: Pick<DeviceState<never>, 'devices' | 'selectedDevice' | 'isMute'>,
): void => {
  const preferences = parseLocalDevicePreferences(key);
  const nextPreference = getSelectedDevicePreference(
    state.devices,
    state.selectedDevice,
  );
  const preferenceHistory = [preferences[deviceKey] ?? []]
    .flat()
    .filter(
      (p) =>
        p.selectedDeviceId !== nextPreference.selectedDeviceId &&
        (p.selectedDeviceLabel === '' ||
          p.selectedDeviceLabel !== nextPreference.selectedDeviceLabel),
    );

  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...preferences,
      mic: undefined, // for backwards compatibility
      [deviceKey]: [
        {
          ...nextPreference,
          muted: state.isMute,
        } satisfies LocalDevicePreference,
        ...preferenceHistory,
      ].slice(0, 3),
    }),
  );
};

const selectDevice = async (
  manager: DeviceManagerLike,
  preference: LocalDevicePreference[],
  devices: MediaDeviceInfo[],
): Promise<void> => {
  for (const p of preference) {
    if (p.selectedDeviceId === defaultDevice) {
      return;
    }

    const device =
      devices.find((d) => d.deviceId === p.selectedDeviceId) ??
      devices.find((d) => d.label === p.selectedDeviceLabel);

    if (device) {
      await manager.select(device.deviceId);
      return;
    }
  }
};

const getSelectedDevicePreference = (
  devices: MediaDeviceInfo[],
  selectedDevice: string | undefined,
): Pick<LocalDevicePreference, 'selectedDeviceId' | 'selectedDeviceLabel'> => ({
  selectedDeviceId: selectedDevice || defaultDevice,
  selectedDeviceLabel:
    devices?.find((d) => d.deviceId === selectedDevice)?.label ?? '',
});
