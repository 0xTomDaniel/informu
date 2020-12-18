import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import { UserErrorType } from "../metaLanguage/UserError";

export const FailedToFindMuTag: UserErrorType = {
    name: "FailedToFindMuTag",
    userFriendlyMessage:
        "Could not find Mu tag. Please ensure that Mu tag is charged and move it closer to the app."
};

export const FailedToConnectToMuTag: UserErrorType = {
    name: "FailedToConnectToMuTag",
    userFriendlyMessage:
        "Could not connect to Mu tag. Please ensure that Mu tag is charged and move it closer to the app."
};

export const FindUnprovisionedMuTagTimeout: UserErrorType = {
    name: "FindUnprovisionedMuTagTimeout",
    userFriendlyMessage: "Finding unprovisioned Mu tags has timed out."
};

export const MuTagDisconnectedUnexpectedly: UserErrorType = {
    name: "MuTagDisconnectedUnexpectedly",
    userFriendlyMessage: "Mu tag has disconnected unexpectedly."
};

export const MuTagCommunicationFailure: UserErrorType = {
    name: "MuTagCommunicationFailure",
    userFriendlyMessage:
        "There was a problem communicating with the Mu tag. Please move Mu tag closer to the app."
};

export class Connection {
    readonly uid = Symbol("uid");
}

export interface UnprovisionedMuTag {
    batteryLevel: Percent | undefined;
    macAddress: string;
    rssi: Rssi;
}

export enum TxPowerSetting {
    "+6 dBm" = 1,
    "0 dBm",
    "-8 dBm",
    "-15 dBm",
    "-20 dBm"
}

export enum AdvertisingIntervalSetting {
    "1,285 ms" = 1,
    "1,022 ms",
    "852 ms",
    "760 ms",
    "546 ms",
    "417 ms",
    "318 ms",
    "211 ms",
    "152 ms",
    "100 ms",
    "200 ms"
}

export default interface MuTagDevicesPort {
    /**
     * @function startFindingUnprovisionedMuTags
     * @param {Rssi} proximityThreshold - Mu tag with an RSSI less than this threshold will be ignored.
     * @param {number} timeout - Promise will resolve when timeout in seconds has been reached.
     */
    changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        connection: Connection
    ): Promise<void>;
    changeTxPower(
        txPower: TxPowerSetting,
        connection: Connection
    ): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        timeout: Millisecond
    ): Observable<Connection>;
    connectToUnprovisionedMuTag(
        unprovisionedMuTag: UnprovisionedMuTag
    ): Observable<Connection>;
    disconnectFromMuTag(connection: Connection): Promise<void>;
    provisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        connection: Connection,
        minimumBatteryLevel?: Percent
    ): Promise<void>;
    readBatteryLevel(connection: Connection): Promise<Percent>;
    startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: number
    ): Observable<UnprovisionedMuTag>;
    stopFindingUnprovisionedMuTags(): Promise<void>;
    unprovisionMuTag(connection: Connection): Promise<void>;
}
