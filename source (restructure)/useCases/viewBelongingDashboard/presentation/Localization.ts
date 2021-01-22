import * as D from "io-ts/lib/Decoder";

export const ViewBelongingDashboardTextDecoder = D.type({
    BelongingCard: D.type({
        NoAddressName: D.string,
        ButtonRemove: D.string
    }),
    LastSeen: D.type({
        DaysAgo: D.string,
        HoursAgo: D.string,
        MinutesAgo: D.string,
        SecondsAgo: D.string,
        JustNow: D.string
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
