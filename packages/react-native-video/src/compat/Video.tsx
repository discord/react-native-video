import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useEvent } from '../core/hooks/useEvent';
import { useVideoPlayer } from '../core/hooks/useVideoPlayer';
import type { MixAudioMode } from '../core/types/MixAudioMode';
import type { ResizeMode as V7ResizeMode } from '../core/types/ResizeMode';
import type { VideoConfig } from '../core/types/VideoConfig';
import type { VideoRuntimeError } from '../core/types/VideoError';
import VideoView from '../core/video-view/VideoView';
import type { VideoViewRef } from '../core/video-view/VideoViewProps';
import {
  DISCORD_HTTP_ENGINE_HEADER,
  type HttpEngine,
  type LoadError,
  type MixWithOthers,
  type OnBufferData,
  type OnLoadData,
  type OnPlaybackRateData,
  type OnProgressData,
  type OnSeekData,
  type ResizeMode,
} from './legacyTypes';

const NOOP = () => {};

export interface VideoRef {
  seek: (time: number, tolerance?: number) => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  setNativeProps: (props: Record<string, unknown>) => void;
}

export interface VideoProperties extends ViewProps {
  source: { uri?: string; headers?: Record<string, string> } | number;
  poster?: string;
  posterResizeMode?: ImageResizeMode;
  resizeMode?: ResizeMode;
  repeat?: boolean;
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  rate?: number;
  playInBackground?: boolean;
  playWhenInactive?: boolean;
  pictureInPicture?: boolean;
  ignoreSilentSwitch?: 'ignore' | 'obey';
  disableFocus?: boolean;
  controls?: boolean;
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  mixWithOthers?: MixWithOthers;
  httpEngine?: HttpEngine;
  automaticallyWaitsToMinimizeStalling?: boolean;
  progressUpdateInterval?: number;
  style?: StyleProp<ViewStyle>;

  onLoadStart?: () => void;
  onLoad?: (data: OnLoadData) => void;
  onBuffer?: (data: OnBufferData) => void;
  onError?: (error: LoadError) => void;
  onProgress?: (data: OnProgressData) => void;
  onSeek?: (data: OnSeekData) => void;
  onEnd?: () => void;
  onReadyForDisplay?: () => void;
  onPlaybackRateChange?: (data: OnPlaybackRateData) => void;
  onPlaybackStalled?: () => void;
  onPlaybackResume?: () => void;
  onBandwidthUpdate?: (data: { bitrate: number }) => void;
  onAudioFocusChanged?: () => void;
  onAudioBecomingNoisy?: () => void;
  onPictureInPictureStatusChanged?: (data: { isActive: boolean }) => void;
  onExternalPlaybackChange?: (data: {
    isExternalPlaybackActive: boolean;
  }) => void;
  onVideoTracks?: (data: unknown) => void;
  onDownloadProgress?: (data: { progressPercent: number }) => void;
}

function mapMixWithOthers(value: MixWithOthers | undefined): MixAudioMode {
  switch (value) {
    case 'mix':
      return 'mixWithOthers';
    case 'duck':
      return 'duckOthers';
    case 'inherit':
    default:
      return 'auto';
  }
}

function mapResizeMode(mode: ResizeMode | undefined): V7ResizeMode {
  switch (mode) {
    case 'stretch':
      return 'stretch';
    case 'cover':
      return 'cover';
    case 'none':
      return 'none';
    case 'contain':
    default:
      return 'contain';
  }
}

function toLoadError(error: VideoRuntimeError): LoadError {
  return {
    error: {
      '': error.message,
      localizedDescription: error.message,
      errorString: error.message,
      errorException: error.code,
    },
  };
}

function buildVideoConfig(
  source: VideoProperties['source'],
  httpEngine: HttpEngine | undefined
): VideoConfig | string | number {
  if (typeof source === 'number') {
    return source;
  }

  const uri = source.uri ?? '';
  const headers: Record<string, string> = { ...(source.headers ?? {}) };
  if (httpEngine != null && httpEngine !== 'default') {
    headers[DISCORD_HTTP_ENGINE_HEADER] = httpEngine;
  }

  return {
    uri,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}

/**
 * Backward-compatible `<Video>` built on the v7 `useVideoPlayer` + `VideoView` API.
 * Preserves the prop/event/ref surface Discord used on 5.x so call sites can upgrade safely.
 */
const Video = forwardRef<VideoRef, VideoProperties>(function Video(
  {
    source,
    poster,
    posterResizeMode = 'contain',
    resizeMode = 'contain',
    repeat = false,
    paused = false,
    muted = false,
    volume = 1,
    rate = 1,
    playInBackground = false,
    playWhenInactive = false,
    pictureInPicture = false,
    ignoreSilentSwitch,
    disableFocus = false,
    controls = false,
    preventsDisplaySleepDuringVideoPlayback = true,
    mixWithOthers = 'inherit',
    httpEngine,
    style,
    onLoadStart,
    onLoad,
    onBuffer,
    onError,
    onProgress,
    onSeek,
    onEnd,
    onReadyForDisplay,
    onPlaybackRateChange,
    onPlaybackStalled,
    onPlaybackResume,
    onBandwidthUpdate,
    onAudioFocusChanged,
    onAudioBecomingNoisy,
    onPictureInPictureStatusChanged,
    onExternalPlaybackChange,
    // Accepted for API compatibility; not forwarded to the v7 player.
    automaticallyWaitsToMinimizeStalling: _automaticallyWaitsToMinimizeStalling,
    progressUpdateInterval: _progressUpdateInterval,
    onVideoTracks: _onVideoTracks,
    onDownloadProgress: _onDownloadProgress,
    ...viewProps
  },
  ref
) {
  const videoConfig = useMemo(
    () => buildVideoConfig(source, httpEngine),
    [source, httpEngine]
  );

  const player = useVideoPlayer(videoConfig, (p) => {
    p.muted = muted;
    p.loop = repeat;
    p.volume = volume;
    p.rate = rate;
    p.playInBackground = playInBackground;
    p.playWhenInactive = playWhenInactive;
    p.mixAudioMode = disableFocus
      ? 'mixWithOthers'
      : mapMixWithOthers(mixWithOthers);
    if (ignoreSilentSwitch === 'ignore') {
      p.ignoreSilentSwitchMode = 'ignore';
    } else if (ignoreSilentSwitch === 'obey') {
      p.ignoreSilentSwitchMode = 'obey';
    }
    if (paused) {
      p.pause();
    } else {
      p.play();
    }
  });

  const viewRef = useRef<VideoViewRef>(null);
  const [showPoster, setShowPoster] = React.useState(poster != null);

  useImperativeHandle(
    ref,
    () => ({
      seek(time: number) {
        player.seekTo(time);
      },
      presentFullscreenPlayer() {
        viewRef.current?.enterFullscreen();
      },
      dismissFullscreenPlayer() {
        viewRef.current?.exitFullscreen();
      },
      setNativeProps(props: Record<string, unknown>) {
        // Discord teardown path (quests/ads): pause + clear source so playback
        // cannot continue after unmount on Android.
        if (props.paused === true) {
          player.pause();
        }
        if (props.repeat === false) {
          player.loop = false;
        }
        const src = props.src as { uri?: string | null } | undefined;
        if (src != null && (src.uri == null || src.uri === '')) {
          void player.replaceSourceAsync(null);
        }
      },
    }),
    [player]
  );

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = repeat;
  }, [player, repeat]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    player.rate = rate;
  }, [player, rate]);

  useEffect(() => {
    player.playInBackground = playInBackground;
  }, [player, playInBackground]);

  useEffect(() => {
    player.playWhenInactive = playWhenInactive;
  }, [player, playWhenInactive]);

  useEffect(() => {
    player.mixAudioMode = disableFocus
      ? 'mixWithOthers'
      : mapMixWithOthers(mixWithOthers);
  }, [player, disableFocus, mixWithOthers]);

  useEffect(() => {
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, paused]);

  const handleLoadStart = useCallback(() => {
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback(
    (data: {
      currentTime: number;
      duration: number;
      height: number;
      width: number;
      orientation: string;
    }) => {
      setShowPoster(false);
      onLoad?.({
        canPlayFastForward: true,
        canPlayReverse: true,
        canPlaySlowForward: true,
        canPlaySlowReverse: true,
        canStepBackward: true,
        canStepForward: true,
        currentTime: data.currentTime,
        duration: data.duration,
        naturalSize: {
          height: data.height,
          width: data.width,
          orientation:
            data.orientation === 'portrait'
              ? 'portrait'
              : data.width >= data.height
                ? 'landscape'
                : 'horizontal',
        },
      });
    },
    [onLoad]
  );

  const handleProgress = useCallback(
    (data: { currentTime: number; bufferDuration: number }) => {
      onProgress?.({
        currentTime: data.currentTime,
        playableDuration: data.bufferDuration,
        seekableDuration: Number.isFinite(player.duration)
          ? player.duration
          : data.bufferDuration,
      });
    },
    [onProgress, player]
  );

  const handleBuffer = useCallback(
    (buffering: boolean) => {
      onBuffer?.({ isBuffering: buffering });
      if (buffering) {
        onPlaybackStalled?.();
      } else {
        onPlaybackResume?.();
      }
    },
    [onBuffer, onPlaybackStalled, onPlaybackResume]
  );

  const handleSeek = useCallback(
    (seekTime: number) => {
      onSeek?.({
        currentTime: player.currentTime,
        seekTime,
      });
    },
    [onSeek, player]
  );

  const handleError = useCallback(
    (error: VideoRuntimeError) => {
      onError?.(toLoadError(error));
    },
    [onError]
  );

  const handlePlaybackRateChange = useCallback(
    (playbackRate: number) => {
      onPlaybackRateChange?.({ playbackRate });
    },
    [onPlaybackRateChange]
  );

  const handleReady = useCallback(() => {
    setShowPoster(false);
    onReadyForDisplay?.();
  }, [onReadyForDisplay]);

  const handleBandwidth = useCallback(
    (data: { bitrate: number }) => {
      onBandwidthUpdate?.({ bitrate: data.bitrate });
    },
    [onBandwidthUpdate]
  );

  const handleAudioFocus = useCallback(() => {
    onAudioFocusChanged?.();
  }, [onAudioFocusChanged]);

  const handleExternalPlayback = useCallback(
    (isActive: boolean) => {
      onExternalPlaybackChange?.({ isExternalPlaybackActive: isActive });
    },
    [onExternalPlaybackChange]
  );

  useEvent(player, 'onLoadStart', handleLoadStart);
  useEvent(player, 'onLoad', handleLoad);
  useEvent(player, 'onProgress', handleProgress);
  useEvent(player, 'onBuffer', handleBuffer);
  useEvent(player, 'onSeek', handleSeek);
  useEvent(player, 'onEnd', onEnd ?? NOOP);
  useEvent(player, 'onError', handleError);
  useEvent(player, 'onPlaybackRateChange', handlePlaybackRateChange);
  useEvent(player, 'onReadyToDisplay', handleReady);
  useEvent(player, 'onBandwidthUpdate', handleBandwidth);
  useEvent(player, 'onAudioFocusChange', handleAudioFocus);
  useEvent(player, 'onAudioBecomingNoisy', onAudioBecomingNoisy ?? NOOP);
  useEvent(player, 'onExternalPlaybackChange', handleExternalPlayback);

  useEffect(() => {
    if (viewRef.current == null || onPictureInPictureStatusChanged == null) {
      return;
    }
    const sub = viewRef.current.addEventListener(
      'onPictureInPictureChange',
      (isActive) => {
        onPictureInPictureStatusChanged({ isActive });
      }
    );
    return () => sub.remove();
  }, [onPictureInPictureStatusChanged]);

  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;

  return (
    <View {...viewProps} style={[{ overflow: 'hidden' }, style]}>
      <VideoView
        ref={viewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        resizeMode={mapResizeMode(resizeMode)}
        controls={controls}
        pictureInPicture={pictureInPicture}
        keepScreenAwake={preventsDisplaySleepDuringVideoPlayback}
      />
      {showPoster && poster != null ? (
        <Image
          source={{ uri: poster }}
          resizeMode={posterResizeMode}
          style={[
            StyleSheet.absoluteFill,
            flatStyle?.width != null || flatStyle?.height != null
              ? { width: flatStyle.width, height: flatStyle.height }
              : null,
          ]}
        />
      ) : null}
    </View>
  );
});

Video.displayName = 'Video';

export default Video;
