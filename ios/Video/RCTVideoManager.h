#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RNVVideoManager : RCTViewManager <RCTBridgeModule>

+ (BOOL)guardAudioSession;

@end
