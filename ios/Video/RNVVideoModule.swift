import Foundation
import React_Core

/// Discord: native module exposing stutter-mitigation experiment toggles.
///
/// Enabled from JS via `NativeModules.RNVVideo` (see NativeExperimentBridgeManager).
///
/// - `optimizeConfigureAudio`: legacy API-compat flag; v6 AudioSessionManager already
///   skips session work for muted-only playback.
/// - `useBackgroundProgressQueue`: runs the periodic progress observer on a background
///   serial queue; event delivery is marshalled back to main.
@objc(RNVVideo)
class RNVVideoModule: NSObject {
    private static let progressQueueLabel = "com.discord.react-native-video.progress"

    private static var _optimizeConfigureAudio = false
    private static var _useBackgroundProgressQueue = false

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
