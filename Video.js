import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, requireNativeComponent, NativeModules, UIManager, View, Image, Platform, findNodeHandle } from 'react-native';
import { ViewPropTypes, ImagePropTypes } from 'deprecated-react-native-prop-types';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import TextTrackType from './TextTrackType';
import FilterType from './FilterType';
import DRMType from './DRMType';
import VideoResizeMode from './VideoResizeMode.js';

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

const { VideoDecoderProperties } = NativeModules
export { TextTrackType, FilterType, DRMType, VideoDecoderProperties }

export default class Video extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showPoster: !!props.poster,
    };
  }

  setNativeProps(nativeProps) {
    this._root.setNativeProps(nativeProps);
  }

  toTypeString(x) {
    switch (typeof x) {
      case 'object':
        return x instanceof Date
          ? x.toISOString()
          : JSON.stringify(x); // object, null
      case 'undefined':
        return '';
      default: // boolean, number, string
        return x.toString();
    }
  }

  stringsOnlyObject(obj) {
    const strObj = {};

    Object.keys(obj).forEach(x => {
      strObj[x] = this.toTypeString(obj[x]);
    });

    return strObj;
  }

  seek = (time, tolerance = 100) => {
    if (isNaN(time)) {throw new Error('Specified time is not a number');}

    if (Platform.OS === 'ios') {
      this.setNativeProps({
        seek: {
          time,
          tolerance,
        },
      });
    } else {
      this.setNativeProps({ seek: time });
    }
  };

  presentFullscreenPlayer = () => {
    this.setNativeProps({ fullscreen: true });
  };

  dismissFullscreenPlayer = () => {
    this.setNativeProps({ fullscreen: false });
  };

  save = async (options?) => {
    return await NativeModules.VideoManager.save(options, findNodeHandle(this._root));
  }

  restoreUserInterfaceForPictureInPictureStopCompleted = (restored) => {
    this.setNativeProps({ restoreUserInterfaceForPIPStopCompletionHandler: restored });
  };

  _assignRoot = (component) => {
    this._root = component;
  };

  _hidePoster = () => {
    if (this.state.showPoster) {
      this.setState({ showPoster: false });
    }
  }

  _onLoadStart = (event) => {
    if (this.props.onLoadStart) {
      this.props.onLoadStart(event.nativeEvent);
    }
  };

  _onPlaybackStateChanged = (event) => {
    if (this.props.onPlaybackStateChanged) {
      this.props.onPlaybackStateChanged(event.nativeEvent);
    }
  };

  _onLoad = (event) => {
    // Need to hide poster here for windows as onReadyForDisplay is not implemented
    if (Platform.OS === 'windows') {
      this._hidePoster();
    }
    if (this.props.onLoad) {
      this.props.onLoad(event.nativeEvent);
    }
  };

  _onAudioTracks = (event) => {
    if (this.props.onAudioTracks) {
      this.props.onAudioTracks(event.nativeEvent);
    }
  };

  _onTextTracks = (event) => {
    if (this.props.onTextTracks) {
      this.props.onTextTracks(event.nativeEvent);
    }
  };

  _onVideoTracks = (event) => {
    if (this.props.onVideoTracks) {
      this.props.onVideoTracks(event.nativeEvent);
    }
  };

  _onError = (event) => {
    if (this.props.onError) {
      this.props.onError(event.nativeEvent);
    }
  };

  _onProgress = (event) => {
    if (this.props.onProgress) {
      this.props.onProgress(event.nativeEvent);
    }
  };

  _onBandwidthUpdate = (event) => {
    if (this.props.onBandwidthUpdate) {
      this.props.onBandwidthUpdate(event.nativeEvent);
    }
  };

  _onSeek = (event) => {
    if (this.props.onSeek) {
      this.props.onSeek(event.nativeEvent);
    }
  };

  _onEnd = (event) => {
    if (this.props.onEnd) {
      this.props.onEnd(event.nativeEvent);
    }
  };

  _onTimedMetadata = (event) => {
    if (this.props.onTimedMetadata) {
      this.props.onTimedMetadata(event.nativeEvent);
    }
  };

  _onFullscreenPlayerWillPresent = (event) => {
    if (this.props.onFullscreenPlayerWillPresent) {
      this.props.onFullscreenPlayerWillPresent(event.nativeEvent);
    }
  };

  _onFullscreenPlayerDidPresent = (event) => {
    if (this.props.onFullscreenPlayerDidPresent) {
      this.props.onFullscreenPlayerDidPresent(event.nativeEvent);
    }
  };

  _onFullscreenPlayerWillDismiss = (event) => {
    if (this.props.onFullscreenPlayerWillDismiss) {
      this.props.onFullscreenPlayerWillDismiss(event.nativeEvent);
    }
  };

  _onFullscreenPlayerDidDismiss = (event) => {
    if (this.props.onFullscreenPlayerDidDismiss) {
      this.props.onFullscreenPlayerDidDismiss(event.nativeEvent);
    }
  };

  _onReadyForDisplay = (event) => {
    if (!this.props.audioOnly) {
      this._hidePoster();
    }

    if (this.props.onReadyForDisplay) {
      this.props.onReadyForDisplay(event.nativeEvent);
    }
  };

  _onPlaybackStalled = (event) => {
    if (this.props.onPlaybackStalled) {
      this.props.onPlaybackStalled(event.nativeEvent);
    }
  };

  _onPlaybackResume = (event) => {
    if (this.props.onPlaybackResume) {
      this.props.onPlaybackResume(event.nativeEvent);
    }
  };

  _onPlaybackRateChange = (event) => {
    if (this.props.onPlaybackRateChange) {
      this.props.onPlaybackRateChange(event.nativeEvent);
    }
  };

  _onExternalPlaybackChange = (event) => {
    if (this.props.onExternalPlaybackChange) {
      this.props.onExternalPlaybackChange(event.nativeEvent);
    }
  }

  _onAudioBecomingNoisy = () => {
    if (this.props.onAudioBecomingNoisy) {
      this.props.onAudioBecomingNoisy();
    }
  };

  _onPictureInPictureStatusChanged = (event) => {
    if (this.props.onPictureInPictureStatusChanged) {
      this.props.onPictureInPictureStatusChanged(event.nativeEvent);
    }
  };

  _onRestoreUserInterfaceForPictureInPictureStop = (event) => {
    if (this.props.onRestoreUserInterfaceForPictureInPictureStop) {
      this.props.onRestoreUserInterfaceForPictureInPictureStop();
    }
  };

  _onAudioFocusChanged = (event) => {
    if (this.props.onAudioFocusChanged) {
      this.props.onAudioFocusChanged(event.nativeEvent);
    }
  };

  _onBuffer = (event) => {
    if (this.props.onBuffer) {
      this.props.onBuffer(event.nativeEvent);
    }
  };

  _onGetLicense = (event) => {
    if (this.props.drm && this.props.drm.getLicense instanceof Function) {
      const data = event.nativeEvent;
      if (data && data.spcBase64) {
        const getLicenseOverride = this.props.drm.getLicense(data.spcBase64, data.contentId, data.licenseUrl);
        const getLicensePromise = Promise.resolve(getLicenseOverride); // Handles both scenarios, getLicenseOverride being a promise and not.
        getLicensePromise.then((result => {
          if (result !== undefined) {
            NativeModules.VideoManager.setLicenseResult(result, findNodeHandle(this._root));
          } else {
            NativeModules.VideoManager.setLicenseError && NativeModules.VideoManager.setLicenseError('Empty license result', findNodeHandle(this._root));
          }
        })).catch((error) => {
          NativeModules.VideoManager.setLicenseError && NativeModules.VideoManager.setLicenseError(error, findNodeHandle(this._root));
        });
      } else {
        NativeModules.VideoManager.setLicenseError && NativeModules.VideoManager.setLicenseError('No spc received', findNodeHandle(this._root));
      }
    }
  }

  _onReceiveAdEvent = (event) => {
    if (this.props.onReceiveAdEvent) {
      this.props.onReceiveAdEvent(event.nativeEvent);
    }
  };

  getViewManagerConfig = viewManagerName => {
    if (!UIManager.getViewManagerConfig) {
      return UIManager[viewManagerName];
    }
    return UIManager.getViewManagerConfig(viewManagerName);
  };

  render() {
    const resizeMode = this.props.resizeMode;
    const source = resolveAssetSource(this.props.source) || {};
    const shouldCache = !source.__packager_asset;

    let uri = source.uri || '';
    if (uri && uri.match(/^\//)) {
      uri = `file://${uri}`;
    }

    if (!uri) {
      console.log('Trying to load empty source.');
    }

    const isNetwork = !!(uri && uri.match(/^https?:/i));
    const isAsset = !!(uri && uri.match(/^(assets-library|ph|ipod-library|file|content|ms-appx|ms-appdata):/i));

    if ((uri || uri === '') && !isNetwork && !isAsset) {
      if (this.props.onError) {
        this.props.onError({error: {errorString: 'invalid url, player will stop', errorCode: 'INVALID_URL'}});
      }
    }

    let nativeResizeMode;
    const RCTVideoInstance = this.getViewManagerConfig('RCTVideo');

    if (resizeMode === VideoResizeMode.stretch) {
      nativeResizeMode = RCTVideoInstance.Constants.ScaleToFill;
    } else if (resizeMode === VideoResizeMode.contain) {
      nativeResizeMode = RCTVideoInstance.Constants.ScaleAspectFit;
    } else if (resizeMode === VideoResizeMode.cover) {
      nativeResizeMode = RCTVideoInstance.Constants.ScaleAspectFill;
    } else {
      nativeResizeMode = RCTVideoInstance.Constants.ScaleNone;
    }

    const nativeProps = Object.assign({}, this.props);
    Object.assign(nativeProps, {
      style: [styles.base, nativeProps.style],
      resizeMode: nativeResizeMode,
      src: {
        uri,
        isNetwork,
        isAsset,
        shouldCache,
        type: source.type || '',
        mainVer: source.mainVer || 0,
        patchVer: source.patchVer || 0,
        requestHeaders: source.headers ? this.stringsOnlyObject(source.headers) : {},
        startTime: source.startTime || 0,
        endTime: source.endTime
      },
      onVideoLoadStart: this._onLoadStart,
      onVideoPlaybackStateChanged: this._onPlaybackStateChanged,
      onVideoLoad: this._onLoad,
      onAudioTracks: this._onAudioTracks,
      onTextTracks: this._onTextTracks,
      onVideoTracks: this._onVideoTracks,
      onVideoError: this._onError,
      onVideoProgress: this._onProgress,
      onVideoSeek: this._onSeek,
      onVideoEnd: this._onEnd,
      onVideoBuffer: this._onBuffer,
      onVideoBandwidthUpdate: this._onBandwidthUpdate,
      onTimedMetadata: this._onTimedMetadata,
      onVideoAudioBecomingNoisy: this._onAudioBecomingNoisy,
      onVideoExternalPlaybackChange: this._onExternalPlaybackChange,
      onVideoFullscreenPlayerWillPresent: this._onFullscreenPlayerWillPresent,
      onVideoFullscreenPlayerDidPresent: this._onFullscreenPlayerDidPresent,
      onVideoFullscreenPlayerWillDismiss: this._onFullscreenPlayerWillDismiss,
      onVideoFullscreenPlayerDidDismiss: this._onFullscreenPlayerDidDismiss,
      onReadyForDisplay: this._onReadyForDisplay,
      onPlaybackStalled: this._onPlaybackStalled,
      onPlaybackResume: this._onPlaybackResume,
      onPlaybackRateChange: this._onPlaybackRateChange,
      onAudioFocusChanged: this._onAudioFocusChanged,
      onAudioBecomingNoisy: this._onAudioBecomingNoisy,
      onGetLicense: nativeProps.drm && nativeProps.drm.getLicense && this._onGetLicense,
      onPictureInPictureStatusChanged: this._onPictureInPictureStatusChanged,
      onRestoreUserInterfaceForPictureInPictureStop: this._onRestoreUserInterfaceForPictureInPictureStop,
      onReceiveAdEvent: this._onReceiveAdEvent,
    });

    const posterStyle = {
      ...StyleSheet.absoluteFillObject,
      resizeMode: this.props.posterResizeMode || 'contain',
    };

    return (
      <View style={nativeProps.style}>
        <RCTVideo
          ref={this._assignRoot}
          {...nativeProps}
          style={StyleSheet.absoluteFill}
        />
        {this.state.showPoster && (
          <Image style={posterStyle} source={{ uri: this.props.poster }} />
        )}
      </View>
    );
  }
}

Video.propTypes = {
  filter: PropTypes.oneOf([
    FilterType.NONE,
    FilterType.INVERT,
    FilterType.MONOCHROME,
    FilterType.POSTERIZE,
    FilterType.FALSE,
    FilterType.MAXIMUMCOMPONENT,
    FilterType.MINIMUMCOMPONENT,
    FilterType.CHROME,
    FilterType.FADE,
    FilterType.INSTANT,
    FilterType.MONO,
    FilterType.NOIR,
    FilterType.PROCESS,
    FilterType.TONAL,
    FilterType.TRANSFER,
    FilterType.SEPIA,
  ]),
  filterEnabled: PropTypes.bool,
  onVideoLoadStart: PropTypes.func,
  onVideoLoad: PropTypes.func,
  onVideoBuffer: PropTypes.func,
  onVideoError: PropTypes.func,
  onVideoProgress: PropTypes.func,
  onVideoBandwidthUpdate: PropTypes.func,
  onVideoSeek: PropTypes.func,
  onVideoEnd: PropTypes.func,
  onTimedMetadata: PropTypes.func,
  onVideoAudioBecomingNoisy: PropTypes.func,
  onVideoExternalPlaybackChange: PropTypes.func,
  onVideoFullscreenPlayerWillPresent: PropTypes.func,
  onVideoFullscreenPlayerDidPresent: PropTypes.func,
  onVideoFullscreenPlayerWillDismiss: PropTypes.func,
  onVideoFullscreenPlayerDidDismiss: PropTypes.func,

  /* Wrapper component */
  source: PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
    }),
    // Opaque type returned by require('./video.mp4')
    PropTypes.number,
  ]),
  drm: PropTypes.shape({
    type: PropTypes.oneOf([
      DRMType.CLEARKEY, DRMType.FAIRPLAY, DRMType.WIDEVINE, DRMType.PLAYREADY,
    ]),
    licenseServer: PropTypes.string,
    headers: PropTypes.shape({}),
    base64Certificate: PropTypes.bool,
    certificateUrl: PropTypes.string,
    getLicense: PropTypes.func,
  }),
  localSourceEncryptionKeyScheme: PropTypes.string,
  minLoadRetryCount: PropTypes.number,
  maxBitRate: PropTypes.number,
  resizeMode: PropTypes.string,
  poster: PropTypes.string,
  posterResizeMode: ImagePropTypes.resizeMode,
  repeat: PropTypes.bool,
  automaticallyWaitsToMinimizeStalling: PropTypes.bool,
  allowsExternalPlayback: PropTypes.bool,
  selectedAudioTrack: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }),
  selectedVideoTrack: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }),
  selectedTextTrack: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }),
  textTracks: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      uri: PropTypes.string.isRequired,
      type: PropTypes.oneOf([
        TextTrackType.SRT,
        TextTrackType.TTML,
        TextTrackType.VTT,
      ]),
      language: PropTypes.string.isRequired,
    })
  ),
  paused: PropTypes.bool,
  muted: PropTypes.bool,
  volume: PropTypes.number,
  bufferConfig: PropTypes.shape({
    minBufferMs: PropTypes.number,
    maxBufferMs: PropTypes.number,
    bufferForPlaybackMs: PropTypes.number,
    bufferForPlaybackAfterRebufferMs: PropTypes.number,
    maxHeapAllocationPercent: PropTypes.number,
  }),
  rate: PropTypes.number,
  pictureInPicture: PropTypes.bool,
  playInBackground: PropTypes.bool,
  preferredForwardBufferDuration: PropTypes.number,
  playWhenInactive: PropTypes.bool,
  ignoreSilentSwitch: PropTypes.oneOf(['ignore', 'obey']),
  reportBandwidth: PropTypes.bool,
  contentStartTime: PropTypes.number,
  disableFocus: PropTypes.bool,
  focusable: PropTypes.bool,
  disableBuffering: PropTypes.bool,
  controls: PropTypes.bool,
  audioOnly: PropTypes.bool,
  fullscreenAutorotate: PropTypes.bool,
  fullscreenOrientation: PropTypes.oneOf(['all', 'landscape', 'portrait']),
  progressUpdateInterval: PropTypes.number,
  subtitleStyle: PropTypes.shape({
    paddingTop: PropTypes.number,
    paddingBottom: PropTypes.number,
    paddingLeft: PropTypes.number,
    paddingRight: PropTypes.number,
    fontSize: PropTypes.number,
  }),
  useTextureView: PropTypes.bool,
  useSecureView: PropTypes.bool,
  hideShutterView: PropTypes.bool,
  onLoadStart: PropTypes.func,
  onPlaybackStateChanged: PropTypes.func,
  onLoad: PropTypes.func,
  onAudioTracks: PropTypes.func,
  onTextTracks: PropTypes.func,
  onVideoTracks: PropTypes.func,
  onBuffer: PropTypes.func,
  onError: PropTypes.func,
  onProgress: PropTypes.func,
  onBandwidthUpdate: PropTypes.func,
  onSeek: PropTypes.func,
  onEnd: PropTypes.func,
  onFullscreenPlayerWillPresent: PropTypes.func,
  onFullscreenPlayerDidPresent: PropTypes.func,
  onFullscreenPlayerWillDismiss: PropTypes.func,
  onFullscreenPlayerDidDismiss: PropTypes.func,
  onReadyForDisplay: PropTypes.func,
  onPlaybackStalled: PropTypes.func,
  onPlaybackResume: PropTypes.func,
  onPlaybackRateChange: PropTypes.func,
  onAudioFocusChanged: PropTypes.func,
  onAudioBecomingNoisy: PropTypes.func,
  onPictureInPictureStatusChanged: PropTypes.func,
  onExternalPlaybackChange: PropTypes.func,
  adTagUrl: PropTypes.string,
  onReceiveAdEvent: PropTypes.func,

  /* Required by react-native */
  ...ViewPropTypes,
};

const RCTVideo = requireNativeComponent('RCTVideo');
