import { Rssi } from "../../shared/metaLanguage/Types";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import {
    Connection,
    UnprovisionedMuTag,
    TxPowerSetting,
    AdvertisingIntervalSetting
} from "../../shared/muTagDevices/MuTagDevices";
import Percent from "../../shared/metaLanguage/Percent";

export default interface MuTagDevicesPort {
    /**
     * @function startFindingUnprovisionedMuTags
     * @param {Rssi} proximityThreshold - Mu tag with an RSSI less than this threshold will be ignored.
     * @param {number} timeout - Promise will resolve when timeout in seconds has been reached.
     */
    startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: number
    ): Observable<UnprovisionedMuTag>;
    stopFindingUnprovisionedMuTags(): void;
    provisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        connection: Connection,
        minimumBatteryLevel: Percent
    ): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<Connection>;
    disconnectFromMuTag(connection: Connection): void;
    changeTxPower(
        txPower: TxPowerSetting,
        connection: Connection
    ): Promise<void>;
    changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        connection: Connection
    ): Promise<void>;
}
