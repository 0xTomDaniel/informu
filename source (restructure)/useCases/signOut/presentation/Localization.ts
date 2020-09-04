import * as D from "io-ts/lib/Decoder";

export const SignOutTextDecoder = D.type({
    error: D.type({
        signOutFailed: D.string
    })
});
