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
type ExceptionType = typeof ExceptionType[number];

export class MuTagDevicesException extends Exception<ExceptionType> {
    static isType<T extends ExceptionType>(
        value: unknown,
        type: T
    ): value is MuTagDevicesException & Exception<T> {
        if (value instanceof MuTagDevicesException) {
            return value.type === type;
        }
        return false;
    }

    static FailedToConnectToMuTag(
        originatingError: unknown
    ): MuTagDevicesException {
        return new this(
            "FailedToConnectToMuTag",
            "Failed to connect to Mu tag.",
            "warn",
            originatingError
        );
    }

    static FailedToFindMuTag(originatingError: unknown): MuTagDevicesException {
        return new this(
            "FailedToFindMuTag",
            "Mu tag could not be found.",
            "log",
            originatingError
        );
    }

    static FindNewMuTagTimeout(
        originatingError: unknown
    ): MuTagDevicesException {
        return new this(
            "FindNewMuTagTimeout",
            "Could not find unprovisioned Mu tag before timeout.",
            "log",
            originatingError
        );
    }

    static MuTagCommunicationFailure(
        originatingError: unknown
    ): MuTagDevicesException {
        return new this(
            "MuTagCommunicationFailure",
            "Failed to read or write to Mu tag.",
            "error",
            originatingError
        );
    }

    static MuTagDisconnectedUnexpectedly(
        originatingError: unknown
    ): MuTagDevicesException {
        return new this(
            "MuTagDisconnectedUnexpectedly",
            "Mu tag has disconnected unexpectedly.",
            "warn",
            originatingError
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
