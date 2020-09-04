import * as D from "io-ts/lib/Decoder";

export const ViewBelongingDashboardTextDecoder = D.type({
    belongingCard: D.type({
        noAddressName: D.string,
        buttonRemove: D.string
    }),
    lastSeen: D.type({
        daysAgo: D.string,
        hoursAgo: D.string,
        minutesAgo: D.string,
        secondsAgo: D.string,
        justNow: D.string
    }),
    locationPermissionRequest: D.type({
        title: D.string,
        message: D.string,
        buttonDeny: D.string,
        buttonAllow: D.string
    }),
    signOutDialog: D.type({
        message: D.string,
        buttonCancel: D.string,
        buttonSignOut: D.string
    }),
    dashboard: D.type({
        noMuTagMessage: D.string
    })
});
