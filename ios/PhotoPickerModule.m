#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PhotoPickerModule, NSObject)

RCT_EXTERN_METHOD(
  pickImage:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
