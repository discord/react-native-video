#import <React/RCTBridgeModule.h>

// Discord: bridge declarations for the RNVVideo stutter-mitigation experiment module.
// The Swift implementation lives in RNVVideoModule.swift.
@interface RCT_EXTERN_MODULE (RNVVideo, NSObject)

RCT_EXTERN_METHOD(setOptimizeConfigureAudio : (BOOL)enabled)
RCT_EXTERN_METHOD(setUseBackgroundProgressQueue : (BOOL)enabled)

@end
