import MuTagDevicesPortAddMuTag from "../../useCases/addMuTag/MuTagDevicesPort";
import MuTagDevicesPortRemoveMuTag from "../../useCases/removeMuTag/MuTagDevicesPort";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { Observable, concat, NEVER } from "rxjs";
import {
    switchMap,
    filter,
    map,
    tap,
    take,
    finalize,
    share
} from "rxjs/operators";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import MuTagDevicesPortBatteryUpdates from "../../useCases/updateMuTagBatteries/MuTagDevicesPort";
import Logger from "../metaLanguage/Logger";

export type ConnectionId = string & { readonly _: unique symbol };

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

type MuTagPeripheral = { [K in keyof Peripheral]: NonNullable<Peripheral[K]> };

type MuTagProvisionId = string & { readonly _: unique symbol };

export default class MuTagDevices
    implements
        MuTagDevicesPortAddMuTag,
        MuTagDevicesPortRemoveMuTag,
        MuTagDevicesPortBatteryUpdates {
    //
    // Public instance interface

    constructor(bluetooth: Bluetooth) {
        this.bluetooth = bluetooth;
    }

    async changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        connectionId: ConnectionId
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connectionId);
        const intervalHex = Hexadecimal.fromString(`0${interval}`);
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
            intervalHex
        );
    }

    async changeTxPower(
        txPower: TxPowerSetting,
        connectionId: ConnectionId
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connectionId);
        const txPowerHex = Hexadecimal.fromString(`0${txPower}`);
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.TxPower,
            txPowerHex
        );
    }

    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<ConnectionId> {
        const muTagProvisionId = This.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        return concat(
            this.findProvisionedMuTag(muTagProvisionId, timeout),
            NEVER
        ).pipe(
            switchMap(peripheralId =>
                this.connectAndAuthenticateToMuTag(peripheralId)
            )
        );
    }

    async disconnectFromProvisionedMuTag(
        connectionId: ConnectionId
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connectionId);
        await this.bluetooth.disconnect(peripheralId);
    }

    async provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        minimumBatteryLevel: Percent
    ): Promise<void> {
        const peripheralId = this.unprovisionedMuTags.get(unprovisionedMuTag);
        if (peripheralId == null) {
            throw Error(
                `Unprovisioned Mu tag not found (${JSON.stringify(
                    unprovisionedMuTag
                )}).`
            );
        }
        await this.connectAndAuthenticateToMuTag(peripheralId)
            .pipe(
                switchMap(() =>
                    this.readCharacteristic(
                        peripheralId,
                        MuTagBleGatt.DeviceInformation.BatteryLevel
                    )
                ),
                tap(batteryLevel => {
                    if (
                        batteryLevel.valueOf() < minimumBatteryLevel.valueOf()
                    ) {
                        throw Error(
                            `Unprovisioned Mu tag battery level of %${batteryLevel} is below the %${minimumBatteryLevel} threshold.`
                        );
                    }
                }),
                switchMap(() => {
                    const major = This.getMajor(accountNumber);
                    return this.writeCharacteristic(
                        peripheralId,
                        MuTagBleGatt.MuTagConfiguration.Major,
                        major
                    );
                }),
                switchMap(() => {
                    const minor = This.getMinor(accountNumber, beaconId);
                    return this.writeCharacteristic(
                        peripheralId,
                        MuTagBleGatt.MuTagConfiguration.Minor,
                        minor
                    );
                }),
                switchMap(() => {
                    return this.writeCharacteristic(
                        peripheralId,
                        MuTagBleGatt.MuTagConfiguration.Provision,
                        MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
                    );
                }),
                take(1),
                finalize(() =>
                    this.bluetooth
                        .disconnect(peripheralId)
                        .catch(e => This.logger.warn(e))
                )
            )
            .toPromise();
    }

    async readBatteryLevel(connectionId: ConnectionId): Promise<Percent> {
        const peripheralId = this.getPeripheralId(connectionId);
        const batteryLevelHex = await this.readCharacteristic(
            peripheralId,
            MuTagBleGatt.DeviceInformation.BatteryLevel
        );
        return new Percent(batteryLevelHex.valueOf());
    }

    startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: Millisecond
    ): Observable<UnprovisionedMuTag> {
        return this.findMuTagPeripheral(timeout).pipe(
            filter(peripheral => peripheral.rssi >= proximityThreshold),
            filter(
                peripheral =>
                    !This.isProvisioned(peripheral.advertising.manufacturerData)
            ),
            map(peripheral => this.createUnprovisionedMuTag(peripheral))
        );
    }

    stopFindingUnprovisionedMuTags(): void {
        this.stopScanIfNotInUse();
    }

    async unprovisionMuTag(connectionId: ConnectionId): Promise<void> {
        const peripheralId = this.getPeripheralId(connectionId);
        // Write fails because Mu tag restarts as soon as it is unprovisioned
        this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.Provision,
            MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
        ).catch(e => This.logger.warn(e));
        this.openConnections.delete(connectionId);
    }

    // Protected instance interface

    // Private instance interface

    private activeScan: Observable<MuTagPeripheral> | undefined;
    private activeScanCount = 0;
    private readonly bluetooth: Bluetooth;
    private readonly defaultTimeout = 10000 as Millisecond;
    private readonly openConnections = new Map<ConnectionId, PeripheralId>();
    private readonly provisionedMuTagProximityThreshold = -90 as Rssi;
    private readonly unprovisionedMuTags = new WeakMap<
        UnprovisionedMuTag,
        PeripheralId
    >();

    private async authenticateToMuTag(
        peripheralId: PeripheralId
    ): Promise<void> {
        const authenticate = MuTagBleGatt.MuTagConfiguration.Authenticate;
        await this.writeCharacteristic(
            peripheralId,
            authenticate,
            authenticate.authCode
        );
    }

    private connectAndAuthenticateToMuTag(
        peripheralId: PeripheralId
    ): Observable<ConnectionId> {
        return this.bluetooth.connect(peripheralId).pipe(
            switchMap(() => this.authenticateToMuTag(peripheralId)),
            map(() => {
                const connectionId = uuidV4() as ConnectionId;
                this.openConnections.set(connectionId, peripheralId);
                return connectionId;
            })
        );
    }

    private createUnprovisionedMuTag(
        peripheral: MuTagPeripheral
    ): UnprovisionedMuTag {
        const macAddress = peripheral.id.replace(/:/g, "");
        const unprovisionedMuTag = {
            batteryLevel: undefined,
            macAddress: macAddress,
            rssi: peripheral.rssi
        };
        this.unprovisionedMuTags.set(unprovisionedMuTag, peripheral.id);
        return unprovisionedMuTag;
    }

    private findMuTagPeripheral(
        timeout: Millisecond
    ): Observable<MuTagPeripheral> {
        this.activeScanCount += 1;
        if (this.activeScan != null) {
            return this.activeScan;
        }
        this.activeScan = this.bluetooth
            .startScan([], timeout, ScanMode.LowLatency)
            .pipe(
                filter(peripheral =>
                    This.isMuTag(peripheral.advertising.manufacturerData)
                ),
                filter(
                    (peripheral): peripheral is MuTagPeripheral =>
                        peripheral.rssi != null
                ),
                share()
            );
        return this.activeScan;
    }

    private async findProvisionedMuTag(
        muTagProvisionId: MuTagProvisionId,
        timeout: Millisecond
    ): Promise<PeripheralId> {
        const foundMuTag = this.findMuTagPeripheral(timeout)
            .pipe(
                filter(
                    peripheral =>
                        peripheral.rssi >=
                        this.provisionedMuTagProximityThreshold
                ),
                filter(
                    peripheral =>
                        This.getProvisionId(
                            peripheral.advertising.manufacturerData
                        ) === muTagProvisionId
                ),
                map(peripheral => peripheral.id),
                take(1)
            )
            .toPromise();
        await this.stopFindingProvisionedMuTags();
        return foundMuTag;
    }

    private getPeripheralId(connectionId: ConnectionId): PeripheralId {
        const peripheralId = this.openConnections.get(connectionId);
        if (peripheralId == null) {
            throw Error(`Connection ID (${connectionId}) is invalid.`);
        }
        return peripheralId;
    }

    private async readCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        return this.bluetooth.read(peripheralId, characteristic);
    }

    private async stopFindingProvisionedMuTags(): Promise<void> {
        await this.stopScanIfNotInUse();
    }

    private async stopScanIfNotInUse(): Promise<void> {
        this.activeScanCount -= 1;
        if (this.activeScanCount === 0) {
            await this.bluetooth.stopScan().catch(e => This.logger.warn(e));
        }
    }

    private async writeCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.bluetooth.write(peripheralId, characteristic, value);
    }

    // Public static interface

    // Protected static interface

    // Private static interface

    private static readonly logger = Logger.instance;
    private static readonly muTagDeviceUuid =
        "de7ec7ed1055b055c0dedefea7edfa7e";
    private static readonly unprovisionedProvisionId = "ffffffff" as MuTagProvisionId;

    private static getDeviceUuid(manufacturerData: Buffer): string {
        return manufacturerData.toString("hex").substring(18, 50);
    }

    private static getProvisionId(manufacturerData: Buffer): MuTagProvisionId {
        return manufacturerData
            .toString("hex")
            .substring(51, 59) as MuTagProvisionId;
    }

    private static getMajor(accountNumber: Hexadecimal): Hexadecimal {
        const majorHexString = accountNumber.toString().substr(0, 4);
        return Hexadecimal.fromString(majorHexString);
    }

    private static getMinor(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Hexadecimal {
        const majorMinorHex = accountNumber.toString() + beaconId.toString();
        const minorHex = majorMinorHex.toString().substr(4, 4);
        return Hexadecimal.fromString(minorHex);
    }

    private static getMuTagProvisionIdFrom(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): MuTagProvisionId {
        return (accountNumber.toString() +
            beaconId.toString()) as MuTagProvisionId;
    }

    private static getMuTagProvisionIdFromMajorMinor(
        major: Hexadecimal,
        minor: Hexadecimal
    ): MuTagProvisionId {
        return (major.toString() + minor.toString()) as MuTagProvisionId;
    }

    private static isMuTag(manufacturerData: Buffer): boolean {
        return this.getDeviceUuid(manufacturerData) === this.muTagDeviceUuid;
    }

    private static isProvisioned(manufacturerData: Buffer): boolean {
        return (
            this.getProvisionId(manufacturerData) !==
            this.unprovisionedProvisionId
        );
    }
}

const This = MuTagDevices;
