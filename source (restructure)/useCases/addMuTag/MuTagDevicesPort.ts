import { Rssi } from "../../shared/metaLanguage/Types";
import Percent from "../../shared/metaLanguage/Percent";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";

export type MuTagDeviceId = string & { readonly _: unique symbol };

export interface UnprovisionedMuTag {
    id: MuTagDeviceId;
    batteryLevel: Percent;
}

export enum TxPowerSetting {
    "+6 dBm",
    "0 dBm",
    "-8 dBm",
    "-15 dBm",
    "-20 dBm"
}

export default interface MuTagDevicesPort {
    readonly unprovisionedMuTag: Observable<UnprovisionedMuTag>;

    /**
     * @function startFindingUnprovisionedMuTags
     * @param {Rssi} proximityThreshold - Mu tag with an RSSI less than this threshold will be ignored.
     * @param {number} timeout - Promise will resolve when timeout in seconds has been reached.
     */
    startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: number
    ): Promise<void>;

    stopFindingUnprovisionedMuTags(): void;
    provisionMuTag(
        id: MuTagDeviceId,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void>;
    disconnectFromProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): void;
    changeTxPower(
        txPower: TxPowerSetting,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void>;
}
