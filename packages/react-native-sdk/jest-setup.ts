// Import Jest Native matchers
import '@testing-library/jest-native/extend-expect';

const mockedMedia = {
  getTracks: jest.fn().mockReturnValue([
    {
      id: 'mocked-track-id',
      kind: 'mocked-kind',
      label: 'mocked-label',
      enabled: true,
      muted: false,
      readyState: 'mocked-ready-state',
      stop: jest.fn(),
    },
  ]),
};
const mockedDevices = [
  {
    deviceId: 'mocked-device-id',
    groupId: 'mocked-group-id',
    kind: 'mocked-kind',
    label: 'mocked-label',
  },
];

// Mock the notifee module using the mock provided by @notifee/react-native itself
jest.mock('@notifee/react-native', () =>
  require('@notifee/react-native/jest-mock'),
);

// When mocking we implement only the needed navigator APIs, hence the suppression rule
// @ts-ignore
global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue(mockedMedia),
    enumerateDevices: jest.fn().mockResolvedValue(mockedDevices),
  },
};
