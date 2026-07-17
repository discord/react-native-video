import Foundation

/// Discord: native module exposing stutter-mitigation experiment toggles.
///
/// Enabled from JS via `NativeModules.RNVVideo` (see
/// `NativeExperimentBridgeManager`) behind the video stutter mitigation experiment.
///
/// - `optimizeConfigureAudio`: retained for API compatibility with the 5.x fork.
///   On v7, audio session management is largely handled by `VideoManager`.
/// - `useBackgroundProgressQueue`: runs the periodic progress time observer on a
///   background serial queue so AVPlayer APIs that `dispatch_sync` internally
///   don't stall the main thread. Progress callbacks are marshalled back to main.
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
