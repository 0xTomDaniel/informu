import MuTagDevicesPortAddMuTag, {
    UnprovisionedMuTag,
    MuTagDeviceId,
    TxPowerSetting,
    AdvertisingIntervalSetting
} from "../../useCases/addMuTag/MuTagDevicesPort";
import MuTagDevicesPortRemoveMuTag from "../../useCases/removeMuTag/MuTagDevicesPort";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { NEVER, Observable, from, of } from "rxjs";
import {
    switchMap,
    filter,
    mergeMap,
    map,
    catchError,
    tap,
    take,
    finalize,
    share
} from "rxjs/operators";
import Percent from "../metaLanguage/Percent";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import MuTagDevicesPortBatteryUpdates from "../../useCases/updateMuTagBatteries/MuTagDevicesPort";

type MuTagProvisionId = string & { readonly _: unique symbol };
type MuTagPeripheralId = PeripheralId;
interface MuTagPeripheral extends Peripheral {
    id: MuTagPeripheralId;
}

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

    startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: Millisecond
    ): Observable<UnprovisionedMuTag> {
        this.unprovisionedMuTagProximityThreshold = proximityThreshold;
        const discoveredUnprovisionedMuTag = this.findMuTagPeripheral(
            timeout
        ).pipe(
            filter(
                muTagPeripheral =>
                    muTagPeripheral.rssi != null &&
                    muTagPeripheral.rssi >=
                        this.unprovisionedMuTagProximityThreshold
            ),
            mergeMap(muTagPeripheral =>
                this.getMuTagIfUnprovisioned(muTagPeripheral.id)
            ),
            catchError(e => {
                console.warn(e);
                return NEVER;
            }),
            filter((muTag): muTag is UnprovisionedMuTag => muTag != null)
        );
        return of(this.isBluetoothReady()).pipe(
            switchMap(() => discoveredUnprovisionedMuTag)
        );
    }

    stopFindingUnprovisionedMuTags(): void {
        this.stopScanIfNotInUse();
    }

    async provisionMuTag(
        id: MuTagDeviceId,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        await this.isBluetoothReady();
        const muTagPeripheralId = (id as string) as MuTagPeripheralId;
        await this.connectAndAuthenticateToMuTag(muTagPeripheralId)
            .pipe(
                switchMap(() => {
                    const major = MuTagDevices.getMajor(accountNumber);
                    return this.writeCharacteristic(
                        muTagPeripheralId,
                        MuTagBleGatt.MuTagConfiguration.Major,
                        major
                    );
                }),
                switchMap(() => {
                    const minor = MuTagDevices.getMinor(
                        accountNumber,
                        beaconId
                    );
                    return this.writeCharacteristic(
                        muTagPeripheralId,
                        MuTagBleGatt.MuTagConfiguration.Minor,
                        minor
                    );
                }),
                switchMap(() => {
                    return this.writeCharacteristic(
                        muTagPeripheralId,
                        MuTagBleGatt.MuTagConfiguration.Provision,
                        MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
                    );
                }),
                take(1),
                finalize(() =>
                    this.bluetooth
                        .disconnect(muTagPeripheralId)
                        .catch(e => console.warn(e))
                )
            )
            .toPromise();
        const provisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        this.muTagProvisionIdCache.set(provisionId, muTagPeripheralId);
    }

    async unprovisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        this.muTagProvisionIdCache.delete(muTagProvisionId);

        // Write fails because Mu tag restarts as soon as it is unprovisioned
        this.writeCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.Provision,
            MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
        ).catch(e => console.warn(e));
    }

    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<void> {
        return from(this.isBluetoothReady()).pipe(
            switchMap(() => {
                const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
                    accountNumber,
                    beaconId
                );
                const timeout = this.defaultTimeout;
                return this.getProvisionedMuTagPeripheralId(
                    muTagProvisionId,
                    timeout
                );
            }),
            switchMap(peripheralId =>
                this.connectAndAuthenticateToMuTag(peripheralId)
            )
        );
    }

    disconnectFromProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): void {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        this.getProvisionedMuTagPeripheralId(muTagProvisionId, timeout)
            .then(muTagPeripheralId =>
                this.bluetooth.disconnect(muTagPeripheralId)
            )
            .catch(e => console.warn(e));
    }

    async changeAdvertisingInterval(
        interval: AdvertisingIntervalSetting,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        const intervalHex = Hexadecimal.fromString(`0${interval}`);
        await this.writeCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
            intervalHex
        );
    }

    async changeTxPower(
        txPower: TxPowerSetting,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        let txPowerHex: Hexadecimal;
        switch (txPower) {
            case TxPowerSetting["+6 dBm"]:
                txPowerHex = Hexadecimal.fromString("01");
                break;
            case TxPowerSetting["0 dBm"]:
                txPowerHex = Hexadecimal.fromString("02");
                break;
            case TxPowerSetting["-8 dBm"]:
                txPowerHex = Hexadecimal.fromString("03");
                break;
            case TxPowerSetting["-15 dBm"]:
                txPowerHex = Hexadecimal.fromString("04");
                break;
            case TxPowerSetting["-20 dBm"]:
                txPowerHex = Hexadecimal.fromString("05");
                break;
        }
        await this.writeCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.TxPower,
            txPowerHex
        );
    }

    async readBatteryLevel(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<Percent> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = this.defaultTimeout;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        const batteryLevelHex = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.DeviceInformation.BatteryLevel
        );
        return new Percent(batteryLevelHex.valueOf());
    }

    // Protected instance interface

    // Private instance interface

    private activeScan: Observable<MuTagPeripheral> | undefined;
    private readonly bluetooth: Bluetooth;
    private readonly defaultTimeout = 10000 as Millisecond;
    private readonly ignoredPeripheralCache = new Set<PeripheralId>();
    private readonly muTagPeripheralCache = new Set<MuTagPeripheralId>();
    private readonly muTagProvisionIdCache = new Map<
        MuTagProvisionId,
        MuTagPeripheralId
    >();
    private provisionedMuTagProximityThreshold = -90 as Rssi;
    private activeScanCount = 0;
    private unprovisionedMuTagProximityThreshold = -90 as Rssi;

    private async isBluetoothReady(): Promise<void> {
        await this.bluetooth.enableBluetooth();
    }

    private startFindingProvisionedMuTags(
        proximityThreshold: Rssi,
        timeout: Millisecond
    ): Observable<MuTagProvisionId> {
        this.provisionedMuTagProximityThreshold = proximityThreshold;
        const discoveredProvisionedMuTag = this.findMuTagPeripheral(
            timeout
        ).pipe(
            filter(
                muTagPeripheral =>
                    muTagPeripheral.rssi != null &&
                    muTagPeripheral.rssi >=
                        this.provisionedMuTagProximityThreshold
            ),
            mergeMap(muTagPeripheral =>
                this.getIdIfProvisioned(muTagPeripheral.id)
            ),
            catchError(e => {
                console.warn(e);
                return NEVER;
            }),
            filter((muTag): muTag is MuTagProvisionId => muTag != null)
        );
        return of(this.isBluetoothReady()).pipe(
            switchMap(() => discoveredProvisionedMuTag)
        );
    }

    private stopFindingProvisionedMuTags(): void {
        this.stopScanIfNotInUse();
    }

    private stopScanIfNotInUse(): void {
        this.activeScanCount -= 1;
        if (this.activeScanCount === 0) {
            this.bluetooth.stopScan().catch(e => console.warn(e));
        }
    }

    private async getProvisionedMuTagPeripheralId(
        muTagProvisionId: MuTagProvisionId,
        timeout: Millisecond
    ): Promise<MuTagPeripheralId> {
        let muTagPeripheralId: MuTagPeripheralId;
        try {
            muTagPeripheralId = this.getMuTagPeripheralIdFromCache(
                muTagProvisionId
            );
        } catch (e) {
            console.warn(e);
            muTagPeripheralId = await this.findProvisionedMuTag(
                muTagProvisionId,
                timeout
            );
        }
        return muTagPeripheralId;
    }

    private async findProvisionedMuTag(
        muTagProvisionId: MuTagProvisionId,
        timeout: Millisecond
    ): Promise<MuTagPeripheralId> {
        const provisionedMuTag = await this.startFindingProvisionedMuTags(
            this.provisionedMuTagProximityThreshold,
            timeout
        )
            .pipe(
                filter(
                    discoveredMuTagProvisionId =>
                        discoveredMuTagProvisionId.toString() ===
                        muTagProvisionId.toString()
                ),
                map(provisionId => this.muTagProvisionIdCache.get(provisionId)),
                filter(
                    (peripheralId): peripheralId is PeripheralId =>
                        peripheralId != null
                ),
                take(1)
            )
            .toPromise();
        this.stopFindingProvisionedMuTags();
        return provisionedMuTag;
        /*return new Promise((resolve, reject) => {
            //let hasPromiseCompleted = false;
            const subscription = this.startFindingProvisionedMuTags(
                this.provisionedMuTagProximityThreshold,
                timeout
            ).subscribe(
                discoveredMuTagProvisionId => {
                    if (
                        discoveredMuTagProvisionId.toString() ===
                        muTagProvisionId.toString()
                    ) {
                        const muTagPeripheralId = this.muTagProvisionIdCache.get(
                            muTagProvisionId
                        );
                        if (muTagPeripheralId != null && !hasPromiseCompleted) {
                            hasPromiseCompleted = true;
                            this.stopFindingProvisionedMuTags();
                            subscription.unsubscribe();
                            resolve(muTagPeripheralId);
                        }
                    }
                },
                error => reject(error)
            );
            this.startFindingProvisionedMuTags(-80 as Rssi, timeout).then(
                () => {
                    if (!hasPromiseCompleted) {
                        hasPromiseCompleted = true;
                        subscription.unsubscribe();
                        const timeoutSeconds = timeout / 1000;
                        reject(
                            Error(
                                `Provisioned Mu tag (${muTagProvisionId}) could not be found before ${timeoutSeconds} second timeout.`
                            )
                        );
                    }
                }
            );
        });*/
    }

    private connectAndAuthenticateToMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Observable<void> {
        return this.bluetooth
            .connect(muTagPeripheralId)
            .pipe(switchMap(() => this.authenticateToMuTag(muTagPeripheralId)));
    }

    private async authenticateToMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<void> {
        const authenticate = MuTagBleGatt.MuTagConfiguration.Authenticate;
        await this.writeCharacteristic(
            muTagPeripheralId,
            authenticate,
            authenticate.authCode
        );
    }

    private isMuTag(peripheral: Peripheral): boolean {
        if (this.ignoredPeripheralCache.has(peripheral.id)) {
            return false;
        }
        const isMuTag = this.muTagPeripheralCache.has(
            peripheral.id as MuTagPeripheralId
        )
            ? true
            : MuTagDevices.getDeviceUuid(peripheral) === This.muTagDeviceUuid;
        this.cacheIfNeeded(peripheral.id, isMuTag);
        return isMuTag;
    }

    private cacheIfNeeded(peripheralId: PeripheralId, isMuTag: boolean): void {
        if (isMuTag) {
            const muTagPeripheralId = peripheralId as MuTagPeripheralId;
            if (!this.muTagPeripheralCache.has(muTagPeripheralId)) {
                this.muTagPeripheralCache.add(muTagPeripheralId);
            }
        } else {
            if (!this.ignoredPeripheralCache.has(peripheralId)) {
                this.ignoredPeripheralCache.add(peripheralId);
            }
        }
    }

    private async getMuTagIfUnprovisioned(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<UnprovisionedMuTag | undefined> {
        return this.connectAndAuthenticateToMuTag(muTagPeripheralId)
            .pipe(
                switchMap(() => this.isMuTagProvisionedRead(muTagPeripheralId)),
                switchMap(async isMuTagProvisioned => {
                    if (isMuTagProvisioned) {
                        await this.bluetooth.disconnect(muTagPeripheralId);
                    } else {
                        return this.createUnprovisionedMuTag(
                            muTagPeripheralId
                        ).finally(() =>
                            this.bluetooth.disconnect(muTagPeripheralId)
                        );
                    }
                })
            )
            .toPromise();
    }

    private async getIdIfProvisioned(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<MuTagProvisionId | undefined> {
        return this.connectAndAuthenticateToMuTag(muTagPeripheralId)
            .pipe(
                switchMap(() => this.isMuTagProvisionedRead(muTagPeripheralId)),
                switchMap(async isMuTagProvisioned => {
                    if (!isMuTagProvisioned) {
                        await this.bluetooth.disconnect(muTagPeripheralId);
                    } else {
                        return this.readMuTagProvisionId(
                            muTagPeripheralId
                        ).finally(() =>
                            this.bluetooth.disconnect(muTagPeripheralId)
                        );
                    }
                }),
                tap(muTagProvisionId => {
                    if (muTagProvisionId == null) {
                        return;
                    }
                    if (!this.muTagProvisionIdCache.has(muTagProvisionId)) {
                        this.muTagProvisionIdCache.set(
                            muTagProvisionId,
                            muTagPeripheralId
                        );
                    }
                })
            )
            .toPromise();
    }

    private async isMuTagProvisionedRead(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<boolean> {
        const provisioned = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.Provision
        );
        return provisioned !== undefined;
    }

    private async createUnprovisionedMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<UnprovisionedMuTag> {
        const batteryLevelHex = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.DeviceInformation.BatteryLevel
        );
        const macAddress = muTagPeripheralId.replace(/:/g, "");
        return {
            id: (muTagPeripheralId as string) as MuTagDeviceId,
            batteryLevel: new Percent(batteryLevelHex.valueOf()),
            macAddress: macAddress
        };
    }

    private async readCharacteristic<T>(
        muTagPeripheralId: MuTagPeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        return this.bluetooth.read(muTagPeripheralId, characteristic);
    }

    private async writeCharacteristic<T>(
        muTagPeripheralId: MuTagPeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.bluetooth.write(muTagPeripheralId, characteristic, value);
    }

    private getMuTagPeripheralIdFromCache(
        muTagProvisionId: MuTagProvisionId
    ): MuTagPeripheralId {
        const muTagPeripheralId = this.muTagProvisionIdCache.get(
            muTagProvisionId
        );
        if (muTagPeripheralId == null) {
            throw Error(
                `Mu tag not found in cache with provision ID: ${muTagProvisionId}`
            );
        }
        return muTagPeripheralId;
    }

    private async readMuTagProvisionId(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<MuTagProvisionId> {
        const major = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.Major
        );
        const minor = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBleGatt.MuTagConfiguration.Minor
        );
        if (major == null || minor == null) {
            throw Error(
                `Mu tag provisioning is invalid (peripheral ID: ${muTagPeripheralId}).`
            );
        }
        return MuTagDevices.getMuTagProvisionIdFromMajorMinor(major, minor);
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
                filter(peripheral => this.isMuTag(peripheral)),
                map(peripheral => peripheral as MuTagPeripheral),
                share()
            );
        return this.activeScan;
    }

    // Public static interface

    static getMajor(accountNumber: Hexadecimal): Hexadecimal {
        const majorHexString = accountNumber.toString().substr(0, 4);
        return Hexadecimal.fromString(majorHexString);
    }

    static getMinor(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Hexadecimal {
        const majorMinorHex = accountNumber.toString() + beaconId.toString();
        const minorHex = majorMinorHex.toString().substr(4, 4);
        return Hexadecimal.fromString(minorHex);
    }

    // Protected static interface

    // Private static interface

    private static readonly muTagDeviceUuid =
        "de7ec7ed1055b055c0dedefea7edfa7e";

    private static getMuTagProvisionIdFromMajorMinor(
        major: Hexadecimal,
        minor: Hexadecimal
    ): MuTagProvisionId {
        return (major.toString() + minor.toString()) as MuTagProvisionId;
    }

    private static getMuTagProvisionIdFrom(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): MuTagProvisionId {
        return (accountNumber.toString() +
            beaconId.toString()) as MuTagProvisionId;
    }

    private static getDeviceUuid(peripheral: Peripheral): string | undefined {
        return peripheral.advertising.manufacturerData
            .toString("hex")
            .substring(18, 50);
    }
}

const This = MuTagDevices;
