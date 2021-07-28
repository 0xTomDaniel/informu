import * as D from "io-ts/lib/Decoder";

export const ViewBelongingDashboardTextDecoder = D.type({
    BelongingCard: D.type({
        NoAddressName: D.string,
        ButtonRemove: D.string
    }),
    LastSeenInterval: D.type({
        Day: D.string,
        Hour: D.string,
        Minute: D.string
    }),
    LastSeenRecent: D.type({
        Now: D.string,
        Seconds: D.string
    }),
    LocationPermissionRequest: D.type({
        Title: D.string,
        Message: D.string,
        ButtonDeny: D.string,
        ButtonAllow: D.string
    }),
    Dashboard: D.type({
        NoMuTagMessage: D.string
    })
});
