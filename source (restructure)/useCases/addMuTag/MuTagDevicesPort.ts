import { Rssi } from "../../shared/metaLanguage/Types";
import { Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import {
    ConnectionId,
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
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        minimumBatteryLevel: Percent
    ): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<ConnectionId>;
    disconnectFromProvisionedMuTag(connectionId: ConnectionId): void;
    changeTxPower(
        txPower: TxPowerSetting,
        connectionId: ConnectionId
    ): Promise<void>;
    changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        connectionId: ConnectionId
    ): Promise<void>;
}
