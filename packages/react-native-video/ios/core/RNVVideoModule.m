#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNVVideo, NSObject)

RCT_EXTERN_METHOD(setOptimizeConfigureAudio : (BOOL)enabled)
RCT_EXTERN_METHOD(setUseBackgroundProgressQueue : (BOOL)enabled)

@end
