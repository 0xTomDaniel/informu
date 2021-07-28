import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import Exception from "../metaLanguage/Exception";

type ExceptionType =
    | {
          type: "FailedToConnectToMuTag";
          data: [];
      }
    | {
          type: "FailedToFindMuTag";
          data: [];
      }
    | {
          type: "FindNewMuTagTimeout";
          data: [];
      }
    | {
          type: "MuTagCommunicationFailure";
          data: [];
      }
    | {
          type: "MuTagDisconnectedUnexpectedly";
          data: [];
      };

export class MuTagDevicesException extends Exception<ExceptionType> {
    static FailedToConnectToMuTag(
        sourceException: unknown
    ): MuTagDevicesException {
        return new this(
            { type: "FailedToConnectToMuTag", data: [] },
            "Failed to connect to MuTag.",
            "warn",
            sourceException
        );
    }

    static FailedToFindMuTag(sourceException: unknown): MuTagDevicesException {
        return new this(
            { type: "FailedToFindMuTag", data: [] },
            "MuTag could not be found.",
            "log",
            sourceException
        );
    }

    static FindNewMuTagTimeout(
        sourceException: unknown
    ): MuTagDevicesException {
        return new this(
            { type: "FindNewMuTagTimeout", data: [] },
            "Could not find unprovisioned MuTag before timeout.",
            "log",
            sourceException
        );
    }

    static MuTagCommunicationFailure(
        sourceException: unknown
    ): MuTagDevicesException {
        return new this(
            { type: "MuTagCommunicationFailure", data: [] },
            "Failed to read or write to MuTag.",
            "error",
            sourceException
        );
    }

    static MuTagDisconnectedUnexpectedly(
        sourceException: unknown
    ): MuTagDevicesException {
        return new this(
            { type: "MuTagDisconnectedUnexpectedly", data: [] },
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
