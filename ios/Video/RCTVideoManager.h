#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RNVVideoManager : RCTViewManager <RCTBridgeModule>

@property (class, nonatomic) BOOL optimizeConfigureAudio;
@property (class, nonatomic) BOOL useBackgroundProgressQueue;

@end
