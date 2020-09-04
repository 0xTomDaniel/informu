import * as D from "io-ts/lib/Decoder";

export const BelongingsLocationTextDecoder = D.type({
    foregroundServiceNotification: D.type({
        title: D.string,
        description: D.string
    })
});
