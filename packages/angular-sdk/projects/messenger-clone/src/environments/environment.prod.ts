export const environment = {
  production: true,
  coordinatorUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  wsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  apiKey: process.env['STREAM_API_KEY'] || '5mxvmc2t4qys',
};
