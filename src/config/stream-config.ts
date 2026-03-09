export const streamConfig = {
  retryAttempts: 5,
  retryDelay: 2000,
  defaultMode: 'webrtc',
  defaultMedia: 'video,audio',
} as const;
