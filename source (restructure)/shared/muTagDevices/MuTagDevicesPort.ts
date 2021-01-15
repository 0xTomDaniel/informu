import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import Exception from "../metaLanguage/Exception";

const ExceptionType = [
    "FailedToConnectToMuTag",
    "FailedToFindMuTag",
    "FindNewMuTagTimeout",
    "MuTagCommunicationFailure",
    "MuTagDisconnectedUnexpectedly"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class MuTagDevicesException<T extends ExceptionType> extends Exception<
    T
> {
    static FailedToConnectToMuTag(
        sourceException: unknown
    ): MuTagDevicesException<"FailedToConnectToMuTag"> {
        return new this(
            "FailedToConnectToMuTag",
            "Failed to connect to MuTag.",
            "warn",
            sourceException
        );
    }

    static FailedToFindMuTag(
        sourceException: unknown
    ): MuTagDevicesException<"FailedToFindMuTag"> {
        return new this(
            "FailedToFindMuTag",
            "MuTag could not be found.",
            "log",
            sourceException
        );
    }

    static FindNewMuTagTimeout(
        sourceException: unknown
    ): MuTagDevicesException<"FindNewMuTagTimeout"> {
        return new this(
            "FindNewMuTagTimeout",
            "Could not find unprovisioned MuTag before timeout.",
            "log",
            sourceException
        );
    }

    static MuTagCommunicationFailure(
        sourceException: unknown
    ): MuTagDevicesException<"MuTagCommunicationFailure"> {
        return new this(
            "MuTagCommunicationFailure",
            "Failed to read or write to MuTag.",
            "error",
            sourceException
        );
    }

    static MuTagDisconnectedUnexpectedly(
        sourceException: unknown
    ): MuTagDevicesException<"MuTagDisconnectedUnexpectedly"> {
        return new this(
            "MuTagDisconnectedUnexpectedly",
            "MuTag has disconnected unexpectedly.",
            "warn",
            sourceException
        );
    }
}

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
     * @param {Rssi} proximityThreshold - MuTag with an RSSI less than this threshold will be ignored.
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
