import Foundation
import React_Core

/// Discord: native module exposing stutter-mitigation experiment toggles.
///
/// The Discord app enables these from JS via `NativeModules.RNVVideo` (see
/// `NativeExperimentBridgeManager`) gated behind the video stutter mitigation experiment.
///
/// - `optimizeConfigureAudio`: legacy toggle from the 5.2.1 fork that skipped audio session
///   configuration for muted videos. On v6, `AudioSessionManager` skips `setCategory` unless an
///   unmuted player is actively playing, and does not configure on `registerView` (props arrive
///   later). The mute skip is default — this flag remains for JS API compatibility.
/// - `useBackgroundProgressQueue`: runs the periodic progress time observer on a background
///   serial queue so `sendProgressUpdate` can call AVPlayer APIs that `dispatch_sync` internally
///   (e.g. `currentDate`) without stalling the main thread. Event delivery is marshalled back to
///   the main queue. See `RCTPlayerObserver.addPlayerTimeObserver` and `RCTVideo.sendProgressUpdate`.
@objc(RNVVideo)
class RNVVideoModule: NSObject {
    private static let progressQueueLabel = "com.discord.react-native-video.progress"

    private static var _optimizeConfigureAudio = false
    private static var _useBackgroundProgressQueue = false

    /// Serial queue used for off-main progress observation when `useBackgroundProgressQueue` is on.
    static let progressQueue = DispatchQueue(label: progressQueueLabel, qos: .default)

    @objc static var optimizeConfigureAudio: Bool {
        return _optimizeConfigureAudio
    }

    @objc static var useBackgroundProgressQueue: Bool {
        return _useBackgroundProgressQueue
    }

    @objc(setOptimizeConfigureAudio:)
    func setOptimizeConfigureAudio(_ enabled: Bool) {
        RNVVideoModule._optimizeConfigureAudio = enabled
    }

    @objc(setUseBackgroundProgressQueue:)
    func setUseBackgroundProgressQueue(_ enabled: Bool) {
        RNVVideoModule._useBackgroundProgressQueue = enabled
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
