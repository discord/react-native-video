import AVFoundation
import Foundation

class AudioSessionManager {
    static let shared = AudioSessionManager()

    private var videoViews = NSHashTable<RCTVideo>.weakObjects()
    private var isAudioSessionActive = false
    private var remoteControlEventsActive = false
    private var isAudioSessionManagementForcedDisabled = false

    private var isAudioSessionManagementDisabled: Bool {
        if isAudioSessionManagementForcedDisabled {
            return true
        }
        // If no views are registered, disable audio session management
        if videoViews.allObjects.isEmpty {
            return true
        }

        return videoViews.allObjects.contains { view in
            return view._disableAudioSessionManagement == true
        }
    }

    private init() {
        // Subscribe to audio interruption notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioSessionInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )

        // Subscribe to route change notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Public API

    func setIsAudioSessionManagementForcedDisabled(disabled: Bool) {
        isAudioSessionManagementForcedDisabled = disabled
    }

    func registerView(view: RCTVideo) {
        if videoViews.contains(view) {
            return
        }

        // Do not configure here — JS props (especially muted) are not applied yet.
        videoViews.add(view)
    }

    func unregisterView(view: RCTVideo) {
        if !videoViews.contains(view) {
            return
        }

        videoViews.remove(view)
        updateAudioSessionConfiguration()

        if videoViews.allObjects.isEmpty && !remoteControlEventsActive {
            deactivateAudioSession()
        }
    }

    func updateAudioSessionConfiguration() {
        if isAudioSessionManagementDisabled {
            return
        }

        if remoteControlEventsActive {
            configureForRemoteControlEvents()
            return
        }

        // Muted-only mounts must not touch AVAudioSession (YouTube PiP / Spotify).
        guard hasUnmutedPlayingPlayer() else {
            return
        }

        // configureAudioSession is a no-op when mixWithOthers/ignoreSilentSwitch are
        // both "inherit" (v5 parity) — see that method.
        configureAudioSession()
    }

    private func hasUnmutedPlayingPlayer() -> Bool {
        return videoViews.allObjects.contains { view in
            return !view.isMuted() && view._player != nil && view._player?.rate != 0
        }
    }

    /// Handle remote control events from NowPlayingInfoCenterManager
    func setRemoteControlEventsActive(_ active: Bool) {
        if isAudioSessionManagementDisabled {
            // AUDIO SESSION MANAGEMENT DISABLED BY USER
            return
        }

        remoteControlEventsActive = active

        if active {
            // Force playback category and activate session when remote control events are active
            configureForRemoteControlEvents()
        } else {
            // If no active players, we can deactivate the session
            if !videoViews.allObjects.contains(where: { view in
                return view._player != nil && view._player?.rate != 0
            }) {
                deactivateAudioSession()
            } else {
                // Otherwise reconfigure based on current players
                updateAudioSessionConfiguration()
            }
        }
    }

    /// Notification that a player's properties have changed
    func playerPropertiesChanged(view: RCTVideo) {
        guard videoViews.contains(view) else {
            return
        }

        // Let the rest of this RN prop pass finish (muted vs paused ordering).
        DispatchQueue.main.async { [weak self] in
            self?.updateAudioSessionConfiguration()
        }
    }

    // MARK: - Audio Session Configuration

    private func configureForRemoteControlEvents() {
        let audioSession = AVAudioSession.sharedInstance()

        do {
            // Remote control events always need playback category
            try audioSession.setCategory(.playback, mode: .moviePlayback)
            activateAudioSession()
        } catch {
            print(
                "Failed to configure audio session for remote control events: \(error.localizedDescription)"
            )
        }
    }

    /// Mirrors v5 `configureAudio`: only call `setCategory` when category and/or options
    /// are explicitly chosen. Both props `"inherit"` (and no PiP/background/earpiece/
    /// notification needs) is a no-op so background music can continue.
    private func configureAudioSession() {
        if isAudioSessionManagementDisabled {
            return
        }

        let audioSession = AVAudioSession.sharedInstance()

        let anyPlayerShowNotificationControls = videoViews.allObjects.contains { view in
            return view._showNotificationControls
        }
        let anyPlayerNeedsPiP = videoViews.allObjects.contains { view in
            return view.isPictureInPictureActive()
        }
        let anyPlayerNeedsBackgroundPlayback = videoViews.allObjects.contains { view in
            return view._playInBackground
        }
        let isAnyPlayerUsingEarpiece = videoViews.allObjects.contains { view in
            return view._audioOutput == "earpiece"
        }
        let isSilentSwitchIgnore = videoViews.allObjects.contains { view in
            return view._ignoreSilentSwitch == "ignore"
        }
        let isSilentSwitchObey = videoViews.allObjects.contains { view in
            return view._ignoreSilentSwitch == "obey"
        }

        // Category: nil while ignoreSilentSwitch is inherit (v5).
        var category: AVAudioSession.Category?
        if isSilentSwitchIgnore && isSilentSwitchObey {
            print(
                "Warning: Conflicting ignoreSilentSwitch settings found (obey vs ignore) - defaulting to ignore"
            )
            category = .playback
        } else if isSilentSwitchIgnore {
            category = .playback
        } else if isSilentSwitchObey {
            category = .ambient
        }

        // v6 features that require an explicit category even when silent switch is inherit.
        if anyPlayerNeedsPiP || anyPlayerNeedsBackgroundPlayback || anyPlayerShowNotificationControls {
            if isSilentSwitchObey {
                print(
                    "Warning: ignoreSilentSwitch=obey cannot be used with PiP, backgroundPlayback, or notification controls - using playback category"
                )
            }
            if isAnyPlayerUsingEarpiece {
                print(
                    "Warning: audioOutput=earpiece cannot be used with PiP, backgroundPlayback, or notification controls - using playback category"
                )
            }
            category = .playback
        } else if isAnyPlayerUsingEarpiece {
            if isSilentSwitchObey {
                print(
                    "Warning: audioOutput=earpiece cannot be used with ignoreSilentSwitch=obey - using playAndRecord category"
                )
            }
            category = .playAndRecord
        }

        // Options: unset while mixWithOthers is inherit (v5).
        var options: AVAudioSession.CategoryOptions?
        let shouldEnableMixing = videoViews.allObjects.contains { view in
            return view._mixWithOthers == "mix"
        }
        let shouldEnableDucking = videoViews.allObjects.contains { view in
            return view._mixWithOthers == "duck"
        }
        if shouldEnableMixing && shouldEnableDucking {
            print(
                "Warning: Conflicting mixWithOthers settings found (mix vs duck) - defaulting to mix"
            )
            options = .mixWithOthers
        } else if shouldEnableMixing {
            options = .mixWithOthers
        } else if shouldEnableDucking {
            options = .duckOthers
        }

        // inherit + inherit (and no forced category above) → leave AVAudioSession alone.
        guard category != nil || options != nil else {
            return
        }

        do {
            if let category, let options {
                try audioSession.setCategory(category, mode: .moviePlayback, options: options)
            } else if let category {
                try audioSession.setCategory(category, mode: .moviePlayback)
            } else if let options {
                try audioSession.setCategory(audioSession.category, mode: .moviePlayback, options: options)
            }

            activateAudioSession()

            if isAnyPlayerUsingEarpiece, audioSession.category == .playAndRecord {
                #if os(iOS) || os(visionOS)
                    try audioSession.overrideOutputAudioPort(.speaker)
                #endif
            } else {
                try audioSession.overrideOutputAudioPort(.none)
            }
        } catch {
            print("Failed to configure audio session: \(error.localizedDescription)")
        }
    }

    private func activateAudioSession() {
        if isAudioSessionActive {
            return
        }

        do {
            try AVAudioSession.sharedInstance().setActive(true)
            isAudioSessionActive = true
        } catch {
            print("Failed to activate audio session: \(error.localizedDescription)")
        }
    }

    private func deactivateAudioSession() {
        if !isAudioSessionActive {
            return
        }

        do {
            try AVAudioSession.sharedInstance().setActive(
                false, options: .notifyOthersOnDeactivation
            )
            isAudioSessionActive = false
        } catch {
            print("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }

    // MARK: - Notification Handlers

    @objc
    private func handleAudioSessionInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else {
            return
        }

        switch type {
        case .began:
            // Audio session interrupted, nothing to do as players will pause automatically
            break

        case .ended:
            // Interruption ended, check if we should resume audio session
            if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    updateAudioSessionConfiguration()
                }
            }

        @unknown default:
            break
        }
    }

    @objc
    private func handleAudioRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
        else {
            return
        }

        switch reason {
        case .categoryChange, .override, .wakeFromSleep, .newDeviceAvailable, .oldDeviceUnavailable:
            // Reconfigure audio session when route changes
            updateAudioSessionConfiguration()
        default:
            break
        }
    }
}
