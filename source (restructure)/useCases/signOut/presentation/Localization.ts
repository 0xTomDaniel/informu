import * as D from "io-ts/lib/Decoder";

export const SignOutTextDecoder = D.type({
    BannerMessage: D.type({
        SignOutFailed: D.string
    })
});
