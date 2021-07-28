import * as D from "io-ts/lib/Decoder";

export const AddMuTagTextDecoder = D.type({
    Instructions: D.type({
        List1: D.string,
        List2: D.string,
        Info: D.string,
        ButtonContinue: D.string
    }),
    Naming: D.type({
        AskNameTitle: D.string,
        NameInputLabel: D.string,
        ButtonSave: D.string,
        ButtonSaving: D.string,
        ButtonTryAgain: D.string
    }),
    Adding: D.type({
        Searching: D.string,
        SettingUp: D.string,
        ButtonCancel: D.string,
        ButtonTryAgain: D.string
    }),
    BannerMessage: D.type({
        FailedToAddMuTag: D.string,
        FailedToNameMuTag: D.string,
        LowMuTagBattery: D.string,
        NewMuTagNotFound: D.string
    }),
    SnackbarMessage: D.type({
        FailedToSaveSettings: D.string
    }),
    SnackbarButton: D.type({
        Dismiss: D.string
    })
});
