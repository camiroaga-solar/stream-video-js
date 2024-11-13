import { Event } from '@notifee/react-native';
import { FirebaseMessagingTypes } from './libs/firebaseMessaging';
import { ExpoNotification } from './libs/expoNotifications';
import { NonRingingPushEvent } from '../StreamVideoRN/types';
import { PushNotificationiOSType } from './libs/iosPushNotification';

export type StreamPushPayload =
  | {
      call_cid: string;
      type: 'call.ring' | NonRingingPushEvent;
      sender: string;
    }
  | undefined;

export function isFirebaseStreamVideoMessage(
  message: FirebaseMessagingTypes.RemoteMessage
) {
  return message.data?.sender === 'stream.video';
}

export function isNotifeeStreamVideoEvent(event: Event) {
  const { detail } = event;
  const { notification } = detail;
  return notification?.data?.sender === 'stream.video';
}

export function isExpoNotificationStreamVideoEvent(event: ExpoNotification) {
  if (event.request.trigger.type === 'push') {
    // iOS
    const streamPayload = event.request.trigger.payload
      ?.stream as StreamPushPayload;
    // Android
    const remoteMessageData = event.request.trigger.remoteMessage?.data;
    return (
      streamPayload?.sender === 'stream.video' ||
      remoteMessageData?.sender === 'stream.video'
    );
  }
}

export function isPushNotificationiOSStreamVideoEvent(
  notification: PushNotificationiOSType
) {
  const data = notification.getData();
  const streamPayload = data?.stream as StreamPushPayload;
  return streamPayload?.sender === 'stream.video';
}
