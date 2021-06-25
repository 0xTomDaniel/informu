import * as D from "io-ts/lib/Decoder";

export const RemoveMuTagTextDecoder = D.type({
    BannerButton: D.type({
        Dismiss: D.string
    }),
    BannerMessage: D.type({
        FailedToRemoveMuTag: D.string,
        FailedToRemoveMuTagFromAccount: D.string,
        FailedToResetMuTag: D.string
    }),
    SnackbarButton: D.type({
        Dismiss: D.string
    }),
    SnackbarMessage: D.type({
        FailedToFindMuTag: D.string,
        LowMuTagBattery: D.string
    })
});
