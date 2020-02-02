import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";

export enum TXPowerSetting {
    "+6 dBm",
    "0 dBm",
    "-8 dBm",
    "-15 dBm",
    "-20 dBm"
}

export default interface MuTagDevicesPort {
    unprovisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void>;
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
