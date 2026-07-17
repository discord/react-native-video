#import <React/RCTViewManager.h>

@interface RCTVideoViewViewManager : RCTViewManager
@end

@implementation RCTVideoViewViewManager

RCT_EXPORT_MODULE(RNCVideoView)

RCT_EXPORT_VIEW_PROPERTY(nitroId, NSNumber)

@end
