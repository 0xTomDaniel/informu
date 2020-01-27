import UnprovisionedMuTag from "../../../source/Core/Domain/UnprovisionedMuTag";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import { Rssi } from "../../shared/metaLanguage/Types";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import Percent from "../../shared/metaLanguage/Percent";

export enum TXPowerSetting {
    "+6 dBm",
    "0 dBm",
    "-8 dBm",
    "-15 dBm",
    "-20 dBm"
}

export default interface MuTagDevicesPort {
    /*findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    cancelFindNewMuTag(): void;
    connectToProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;
    disconnectFromProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): void;
    provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: AccountNumber,
        beaconID: BeaconID,
        muTagNumber: number,
        muTagName: string
    ): Promise<ProvisionedMuTag>;
    unprovisionMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;
    readBatteryLevel(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<Percent>;
    changeTXPower(
        txPower: TXPowerSetting,
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;*/
}
