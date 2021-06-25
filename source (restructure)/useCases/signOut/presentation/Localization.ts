import * as D from "io-ts/lib/Decoder";

export const SignOutTextDecoder = D.type({
    BannerButton: D.type({
        Dismiss: D.string
    }),
    BannerMessage: D.type({
        SignOutFailed: D.string
    }),
    DialogButton: D.type({
        Cancel: D.string,
        SignOut: D.string
    }),
    DialogMessage: D.type({
        ConfirmSignOut: D.string
    })
});
