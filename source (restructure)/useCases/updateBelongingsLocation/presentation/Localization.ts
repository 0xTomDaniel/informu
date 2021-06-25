import * as D from "io-ts/lib/Decoder";

export const BelongingsLocationTextDecoder = D.type({
    ForegroundServiceNotification: D.type({
        Title: D.string,
        Description: D.string
    })
});
