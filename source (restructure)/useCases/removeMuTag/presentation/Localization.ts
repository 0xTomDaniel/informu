import * as D from "io-ts/lib/Decoder";

export const RemoveMuTagTextDecoder = D.type({
    BannerMessage: D.type({
        FailedToRemoveMuTag: D.string,
        FailedToRemoveMuTagFromAccount: D.string,
        FailedToResetMuTag: D.string
    }),
    SnackbarMessage: D.type({
        FailedToFindMuTag: D.string,
        LowMuTagBattery: D.string
    })
});
