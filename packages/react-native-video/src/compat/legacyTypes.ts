/**
 * Legacy (v5/v6) type shapes Discord call sites still expect.
 * Kept so we can upgrade to the v7 player API without rewriting every consumer.
 */

export interface OnLoadData {
  canPlayFastForward: boolean;
  canPlayReverse: boolean;
  canPlaySlowForward: boolean;
  canPlaySlowReverse: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  currentTime: number;
  duration: number;
  naturalSize: {
    height: number;
    width: number;
    orientation: 'horizontal' | 'landscape' | 'portrait';
  };
  videoTracks?: Array<{
    width: number;
    height: number;
    bitrate: number;
    trackId: string;
    codecs: string;
  }>;
  audioTracks?: Array<{
    index: number;
    title?: string;
    language?: string;
    type?: string;
  }>;
  textTracks?: Array<{
    index: number;
    title?: string;
    language?: string;
    type?: string;
  }>;
  trackId?: string;
}

export interface OnProgressData {
  currentTime: number;
  playableDuration: number;
  seekableDuration: number;
}

export interface OnDownloadProgressData {
  progressPercent: number;
}

export interface OnBandwidthUpdateData {
  bitrate: number;
}

export interface LoadError {
  error: {
    '': string;
    localizedDescription?: string;
    code?: number;
    errorString?: string;
    errorException?: string;
  };
}

export interface OnSeekData {
  currentTime: number;
  seekTime: number;
  target?: number;
}

export interface OnPlaybackRateData {
  playbackRate: number;
}

export interface OnBufferData {
  isBuffering: boolean;
}

export interface OnPictureInPictureStatusData {
  isActive: boolean;
}

export interface OnExternalPlaybackChangeData {
  isExternalPlaybackActive: boolean;
}

export type MixWithOthers = 'inherit' | 'mix' | 'duck';
export type HttpEngine = 'default' | 'okhttp' | 'cronet' | null;
export type ResizeMode = 'stretch' | 'contain' | 'cover' | 'none';

/** Header used to select Discord's Android HTTP data-source engine. Stripped before network I/O. */
export const DISCORD_HTTP_ENGINE_HEADER = 'X-Discord-Http-Engine';
