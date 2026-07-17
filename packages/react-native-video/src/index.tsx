export { useEvent } from './core/hooks/useEvent';
export { useVideoPlayer } from './core/hooks/useVideoPlayer';
export type * from './core/types/Events';
export type { IgnoreSilentSwitchMode } from './core/types/IgnoreSilentSwitchMode';
export type { MixAudioMode } from './core/types/MixAudioMode';
export type { ResizeMode } from './core/types/ResizeMode';
export type { AudioTrack } from './core/types/AudioTrack';
export type { TextTrack } from './core/types/TextTrack';
export type { VideoTrack } from './core/types/VideoTrack';
export type { VideoConfig, VideoSource } from './core/types/VideoConfig';
export type { WebVideoPlayer } from './core/types/WebVideoPlayer';
export type {
  LibraryError,
  PlayerError,
  SourceError,
  UnknownError,
  VideoComponentError,
  VideoError,
  VideoErrorCode,
  VideoRuntimeError,
  VideoViewError,
  WebError,
} from './core/types/VideoError';
export type { VideoPlayerStatus } from './core/types/VideoPlayerStatus';

export { VideoPlayer } from './core/VideoPlayer';
export { default as VideoView } from './core/video-view/VideoView';
export type {
  VideoViewProps,
  VideoViewRef,
} from './core/video-view/VideoViewProps';
export { setAudioSessionManagementDisabled } from './core/utils/playerFactory';

// Discord: v5/v6-compatible default export so existing call sites keep working.
export { default } from './compat/Video';
export { default as Video } from './compat/Video';
export type { VideoProperties, VideoRef } from './compat/Video';
export type {
  HttpEngine,
  LoadError,
  MixWithOthers,
  OnBandwidthUpdateData,
  OnBufferData,
  OnDownloadProgressData,
  OnExternalPlaybackChangeData,
  OnLoadData,
  OnPictureInPictureStatusData,
  OnPlaybackRateData,
  OnProgressData,
  OnSeekData,
} from './compat/legacyTypes';
export { DISCORD_HTTP_ENGINE_HEADER } from './compat/legacyTypes';
