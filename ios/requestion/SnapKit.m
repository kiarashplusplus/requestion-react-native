#import "SnapKit.h"
#import <React/RCTLog.h>
#import <SCSDKCreativeKit/SCSDKCreativeKit.h>

@implementation SnapKit

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

- (UIImage *)decodeBase64ToImage:(NSString *)strEncodeData {
    NSData *data = [[NSData alloc]initWithBase64EncodedString:strEncodeData options:NSDataBase64DecodingIgnoreUnknownCharacters];
    return [UIImage imageWithData:data];
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(share:(NSString *)base64 url:(NSString *)url width:(NSInteger *)width height:(NSInteger *)height)
{
    RCTLogInfo(@"[SnapKit]");
    NSArray *array = [base64 componentsSeparatedByString:@","];
    
    UIImage *stickerImage = [self decodeBase64ToImage:array[1]];
    SCSDKSnapSticker *sticker = [[SCSDKSnapSticker alloc] initWithStickerImage:stickerImage];
    SCSDKNoSnapContent *snap = [[SCSDKNoSnapContent alloc] init];
    snap.sticker = sticker; /* Optional */
//    snap.caption = @"Requestion on Snapchat!"; /* Optional */
    snap.attachmentUrl = url;
    
    SCSDKSnapAPI *api = [[SCSDKSnapAPI alloc] initWithContent:snap];
    [api startSnappingWithCompletionHandler:^(NSError *error) {
        if(error != nil){
            RCTLogError(error);
        }
        RCTLogInfo(@"[SnapKit] Callback.");
    }];
    return;
}


@end
