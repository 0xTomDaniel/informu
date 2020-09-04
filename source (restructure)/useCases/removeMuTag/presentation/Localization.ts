import * as D from "io-ts/lib/Decoder";

export const RemoveMuTagTextDecoder = D.type({
    error: D.type({
        lowMuTagBattery: D.string,
        failedToConnectToMuTag: D.string,
        muTagCommunicationFailure: D.string,
        failedToRemoveMuTagFromAccount: D.string
    })
});
