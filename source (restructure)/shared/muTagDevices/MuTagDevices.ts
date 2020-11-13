import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { Observable, from } from "rxjs";
import {
    switchMap,
    filter,
    map,
    take,
    share,
    tap,
    catchError,
    first
} from "rxjs/operators";
import Percent from "../metaLanguage/Percent";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import Logger from "../metaLanguage/Logger";
import MuTagDevicesPort, {
    Connection,
    UnprovisionedMuTag,
    TxPowerSetting,
    AdvertisingIntervalSetting,
    MuTagCommunicationFailure,
    FailedToConnectToMuTag,
    FailedToFindMuTag
} from "./MuTagDevicesPort";
import UserError from "../metaLanguage/UserError";

type MuTagPeripheral = { [K in keyof Peripheral]: NonNullable<Peripheral[K]> };

type MuTagProvisionId = string & { readonly _: unique symbol };

export default class MuTagDevices implements MuTagDevicesPort {
    //
    // Public instance interface

    constructor(bluetooth: Bluetooth) {
        this.bluetooth = bluetooth;
    }

    async changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        connection: Connection
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connection);
        const intervalHex = Hexadecimal.fromString(`0${interval}`);
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
            intervalHex
        );
    }

    async changeTxPower(
        txPower: TxPowerSetting,
        connection: Connection
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connection);
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
    ): Observable<Connection> {
        const muTagProvisionId = This.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        return from(
            this.findProvisionedMuTag(muTagProvisionId, this.defaultTimeout)
        ).pipe(
            switchMap(peripheralId =>
                this.connectAndAuthenticateToMuTag(peripheralId)
            )
        );
    }

    connectToUnprovisionedMuTag(
        unprovisionedMuTag: UnprovisionedMuTag
    ): Observable<Connection> {
        const peripheralId = this.unprovisionedMuTags.get(unprovisionedMuTag);
        if (peripheralId == null) {
            throw Error(
                `Unprovisioned Mu tag not found (${JSON.stringify(
                    unprovisionedMuTag
                )}).`
            );
        }
        return this.connectAndAuthenticateToMuTag(peripheralId);
    }

    async disconnectFromMuTag(connection: Connection): Promise<void> {
        const peripheralId = this.getPeripheralId(connection);
        await this.bluetooth.disconnect(peripheralId);
    }

    async provisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal,
        connection: Connection,
        minimumBatteryLevel: Percent
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(connection);
        const batteryLevel = await this.readCharacteristic(
            peripheralId,
            MuTagBleGatt.DeviceInformation.BatteryLevel
        );
        if (batteryLevel.valueOf() < minimumBatteryLevel.valueOf()) {
            throw Error(
                `Unprovisioned Mu tag battery level of %${batteryLevel} is below the %${minimumBatteryLevel} threshold.`
            );
        }
        const major = This.getMajor(accountNumber);
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.Major,
            major
        );
        const minor = This.getMinor(accountNumber, beaconId);
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.Minor,
            minor
        );
        await this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.Provision,
            MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
        );
    }

    async readBatteryLevel(connection: Connection): Promise<Percent> {
        const peripheralId = this.getPeripheralId(connection);
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

    async unprovisionMuTag(connection: Connection): Promise<void> {
        const peripheralId = this.getPeripheralId(connection);
        // Write fails because Mu tag restarts as soon as it is unprovisioned
        this.writeCharacteristic(
            peripheralId,
            MuTagBleGatt.MuTagConfiguration.Provision,
            MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
        ).catch(e => this.logger.warn(e));
    }

    // Protected instance interface

    // Private instance interface

    private activeScan: Observable<MuTagPeripheral> | undefined;
    private activeScanCount = 0;
    private readonly bluetooth: Bluetooth;
    private readonly defaultTimeout = 5000 as Millisecond;
    private readonly logger = Logger.instance;
    private readonly openConnections = new WeakMap<Connection, PeripheralId>();
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
    ): Observable<Connection> {
        let connection: Connection;
        return this.bluetooth.connect(peripheralId).pipe(
            switchMap(() => this.authenticateToMuTag(peripheralId)),
            map(() => {
                connection = new Connection();
                this.openConnections.set(connection, peripheralId);
                return connection;
            }),
            catchError(e => {
                throw UserError.create(FailedToConnectToMuTag, e);
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
        const foundMuTag = await this.findMuTagPeripheral(timeout)
            .pipe(
                filter(
                    peripheral =>
                        peripheral.rssi >=
                        this.provisionedMuTagProximityThreshold
                ),
                first(
                    peripheral =>
                        This.getProvisionId(
                            peripheral.advertising.manufacturerData
                        ) === muTagProvisionId
                ),
                map(peripheral => peripheral.id),
                catchError(e => {
                    debugger;
                    throw UserError.create(FailedToFindMuTag, e);
                })
            )
            .toPromise()
            .catch(e => {
                debugger;
                throw e;
            });
        await this.stopFindingProvisionedMuTags();
        return foundMuTag;
    }

    private getPeripheralId(connection: Connection): PeripheralId {
        const peripheralId = this.openConnections.get(connection);
        if (peripheralId == null) {
            throw Error(`Connection ID (${connection}) is invalid.`);
        }
        return peripheralId;
    }

    private async readCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        return this.bluetooth.read(peripheralId, characteristic).catch(e => {
            throw UserError.create(MuTagCommunicationFailure, e);
        });
    }

    private async stopFindingProvisionedMuTags(): Promise<void> {
        await this.stopScanIfNotInUse();
    }

    private async stopScanIfNotInUse(): Promise<void> {
        this.activeScanCount -= 1;
        if (this.activeScanCount === 0) {
            await this.bluetooth.stopScan().catch(e => this.logger.warn(e));
        }
    }

    private async writeCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.bluetooth
            .write(peripheralId, characteristic, value)
            .catch(e => {
                throw UserError.create(MuTagCommunicationFailure, e);
            });
    }

    // Public static interface

    // Protected static interface

    // Private static interface

    private static readonly muTagDeviceUuid =
        "de7ec7ed1055b055c0dedefea7edfa7e";
    private static readonly unprovisionedProvisionId = "ffffffff" as MuTagProvisionId;

    private static getDeviceUuid(manufacturerData: Buffer): string {
        return manufacturerData.toString("hex").substring(18, 50);
    }

    private static getProvisionId(manufacturerData: Buffer): MuTagProvisionId {
        return manufacturerData
            .toString("hex")
            .substring(50, 58) as MuTagProvisionId;
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
