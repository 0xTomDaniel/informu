import * as D from "io-ts/lib/Decoder";

export const AddMuTagTextDecoder = D.type({
    instructions: D.type({
        list1: D.string,
        list2: D.string,
        info: D.string,
        buttonContinue: D.string
    }),
    naming: D.type({
        askNameTitle: D.string,
        nameInputLabel: D.string,
        buttonAdd: D.string,
        buttonAdding: D.string
    }),
    adding: D.type({
        connecting: D.string,
        info: D.string,
        buttonCancel: D.string
    }),
    error: D.type({
        lowMuTagBattery: D.string,
        newMuTagNotFound: D.string,
        failedToAddMuTag: D.string
    }),
    warning: D.type({
        failedToSaveSettings: D.string
    })
});
