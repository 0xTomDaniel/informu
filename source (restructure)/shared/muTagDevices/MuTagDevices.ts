import MuTagDevicesPortAddMuTag, {
    UnprovisionedMuTag,
    MuTagDeviceId,
    TxPowerSetting
} from "../../useCases/addMuTag/MuTagDevicesPort";
import MuTagDevicesPortRemoveMuTag from "../../useCases/removeMuTag/MuTagDevicesPort";
import Bluetooth, { Peripheral, PeripheralId, ScanMode } from "./Bluetooth";
import { NEVER, Observable, BehaviorSubject } from "rxjs";
import { switchMap, filter, mergeMap, map, catchError } from "rxjs/operators";
import { Buffer } from "buffer";
import Percent from "../metaLanguage/Percent";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";
import { MuTagBLEGATT } from "./MuTagBLEGATT/MuTagBLEGATT";
import Hexadecimal from "../metaLanguage/Hexadecimal";

type MuTagProvisionId = string & { readonly _: unique symbol };
type MuTagPeripheralId = PeripheralId & { readonly _: unique symbol };
interface MuTagPeripheral extends Peripheral {
    id: MuTagPeripheralId;
}

export default class MuTagDevices
    implements MuTagDevicesPortAddMuTag, MuTagDevicesPortRemoveMuTag {
    private readonly muTagDeviceUuid = "de7ec7ed1055b055c0dedefea7edfa7e";
    private hasBluetoothStarted = false;
    private readonly bluetooth: Bluetooth;
    private readonly pauseUnprovisionedMuTag = new BehaviorSubject(true);
    private readonly pauseProvisionedMuTag = new BehaviorSubject(true);
    private unprovisionedMuTagProximityThreshold = -90 as Rssi;
    private provisionedMuTagProximityThreshold = -90 as Rssi;
    private readonly ignoredPeripheralCache = new Set<PeripheralId>();
    private readonly muTagPeripheralCache = new Set<MuTagPeripheralId>();
    private readonly muTagProvisionIdCache = new Map<
        MuTagProvisionId,
        MuTagPeripheralId
    >();

    private readonly discoveredMuTagPeripheral: Observable<MuTagPeripheral>;
    readonly unprovisionedMuTag = this.pauseUnprovisionedMuTag.pipe(
        switchMap(paused => (paused ? NEVER : this.discoveredMuTagPeripheral)),
        filter(
            muTagPeripheral =>
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

    private readonly provisionedMuTag = this.pauseProvisionedMuTag.pipe(
        switchMap(paused => (paused ? NEVER : this.discoveredMuTagPeripheral)),
        filter(
            muTagPeripheral =>
                muTagPeripheral.rssi >= this.provisionedMuTagProximityThreshold
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

    constructor(bluetooth: Bluetooth) {
        this.bluetooth = bluetooth;
        bluetooth
            .start()
            .then(() => (this.hasBluetoothStarted = true))
            .catch(e => console.warn(e));
        this.discoveredMuTagPeripheral = this.bluetooth.discoveredPeripheral.pipe(
            filter(peripheral => {
                const isMuTag = this.isMuTag(peripheral);
                this.cacheIfNeeded(peripheral.id, isMuTag);
                return isMuTag;
            }),
            map(peripheral => peripheral as MuTagPeripheral)
        );
    }

    async startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi,
        timeout: Millisecond
    ): Promise<void> {
        if (!this.hasBluetoothStarted) {
            throw Error("Bluetooth has not started.");
        }
        this.unprovisionedMuTagProximityThreshold = proximityThreshold;
        this.pauseUnprovisionedMuTag.next(false);
        await this.bluetooth.startScan([], timeout, ScanMode.lowLatency);
    }

    stopFindingUnprovisionedMuTags(): void {
        this.pauseUnprovisionedMuTag.next(true);
        this.stopScanIfNotInUse();
    }

    async provisionMuTag(
        id: MuTagDeviceId,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagPeripheralId = (id as string) as MuTagPeripheralId;
        await this.connectAndAuthenticateToMuTag(muTagPeripheralId);
        try {
            const major = MuTagDevices.getMajor(accountNumber);
            await this.writeCharacteristic(
                muTagPeripheralId,
                MuTagBLEGATT.MuTagConfiguration.Major,
                major
            );
            const minor = MuTagDevices.getMinor(accountNumber, beaconId);
            await this.writeCharacteristic(
                muTagPeripheralId,
                MuTagBLEGATT.MuTagConfiguration.Minor,
                minor
            );
            await this.writeCharacteristic(
                muTagPeripheralId,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.provisionCode
            );
            const provisionId = MuTagDevices.getMuTagProvisionIdFrom(
                accountNumber,
                beaconId
            );
            this.muTagProvisionIdCache.set(provisionId, muTagPeripheralId);
        } finally {
            this.bluetooth
                .disconnect(muTagPeripheralId)
                .catch(e => console.warn(e));
        }
    }

    async unprovisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = 5000 as Millisecond;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        this.muTagProvisionIdCache.delete(muTagProvisionId);

        // Write fails because Mu tag restarts as soon as it is unprovisioned
        this.writeCharacteristic(
            muTagPeripheralId,
            MuTagBLEGATT.MuTagConfiguration.Provision,
            MuTagBLEGATT.MuTagConfiguration.Provision.unprovisionCode
        ).catch(e => console.warn(e));
    }

    async connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = 5000 as Millisecond;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        await this.connectAndAuthenticateToMuTag(muTagPeripheralId);
    }

    disconnectFromProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): void {
        const muTagProvisionId = MuTagDevices.getMuTagProvisionIdFrom(
            accountNumber,
            beaconId
        );
        const timeout = 5000 as Millisecond;
        this.getProvisionedMuTagPeripheralId(muTagProvisionId, timeout)
            .then(muTagPeripheralId =>
                this.bluetooth.disconnect(muTagPeripheralId)
            )
            .catch(e => console.warn(e));
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
        const timeout = 5000 as Millisecond;
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
            MuTagBLEGATT.MuTagConfiguration.TxPower,
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
        const timeout = 5000 as Millisecond;
        const muTagPeripheralId = await this.getProvisionedMuTagPeripheralId(
            muTagProvisionId,
            timeout
        );
        const batteryLevelHex = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBLEGATT.DeviceInformation.BatteryLevel
        );
        return new Percent(batteryLevelHex.valueOf());
    }

    private async startFindingProvisionedMuTags(
        proximityThreshold: Rssi,
        timeout: Millisecond
    ): Promise<void> {
        this.provisionedMuTagProximityThreshold = proximityThreshold;
        this.pauseProvisionedMuTag.next(false);
        await this.bluetooth
            .startScan([], timeout)
            .finally(() => this.pauseProvisionedMuTag.next(true));
    }

    private stopFindingProvisionedMuTags(): void {
        this.pauseProvisionedMuTag.next(true);
        this.stopScanIfNotInUse();
    }

    private stopScanIfNotInUse(): void {
        if (
            this.pauseProvisionedMuTag.getValue() &&
            this.pauseUnprovisionedMuTag.getValue()
        ) {
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
        return new Promise((resolve, reject) => {
            let hasPromiseCompleted = false;
            const subscription = this.provisionedMuTag.subscribe(
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
                }
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
        });
    }

    private async connectAndAuthenticateToMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<void> {
        await this.bluetooth.connect(muTagPeripheralId);
        await this.bluetooth.retrieveServices(muTagPeripheralId);
        await this.authenticateToMuTag(muTagPeripheralId);
    }

    private async authenticateToMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<void> {
        const authenticate = MuTagBLEGATT.MuTagConfiguration.Authenticate;
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
        return this.muTagPeripheralCache.has(peripheral.id as MuTagPeripheralId)
            ? true
            : MuTagDevices.getDeviceUuid(peripheral) === this.muTagDeviceUuid;
    }

    private static getDeviceUuid(peripheral: Peripheral): string | undefined {
        const bytes = Buffer.from(
            peripheral.advertising.manufacturerData.bytes
        );
        return bytes.toString("hex").substring(18, 50);
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
        await this.connectAndAuthenticateToMuTag(muTagPeripheralId);
        const isMuTagProvisioned = await this.isMuTagProvisionedRead(
            muTagPeripheralId
        );
        if (isMuTagProvisioned) {
            await this.bluetooth.disconnect(muTagPeripheralId);
            return;
        }
        return this.createUnprovisionedMuTag(muTagPeripheralId).finally(() =>
            this.bluetooth.disconnect(muTagPeripheralId)
        );
    }

    private async getIdIfProvisioned(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<MuTagProvisionId | undefined> {
        await this.connectAndAuthenticateToMuTag(muTagPeripheralId);
        const isMuTagProvisioned = await this.isMuTagProvisionedRead(
            muTagPeripheralId
        );
        if (!isMuTagProvisioned) {
            await this.bluetooth.disconnect(muTagPeripheralId);
            return;
        }
        const muTagProvisionId = await this.readMuTagProvisionId(
            muTagPeripheralId
        ).finally(() => this.bluetooth.disconnect(muTagPeripheralId));

        if (!this.muTagProvisionIdCache.has(muTagProvisionId)) {
            this.muTagProvisionIdCache.set(muTagProvisionId, muTagPeripheralId);
        }
        return muTagProvisionId;
    }

    private async isMuTagProvisionedRead(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<boolean> {
        const provisioned = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBLEGATT.MuTagConfiguration.Provision
        );
        return provisioned !== undefined;
    }

    private async createUnprovisionedMuTag(
        muTagPeripheralId: MuTagPeripheralId
    ): Promise<UnprovisionedMuTag> {
        const batteryLevelHex = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBLEGATT.DeviceInformation.BatteryLevel
        );
        return {
            id: (muTagPeripheralId as string) as MuTagDeviceId,
            batteryLevel: new Percent(batteryLevelHex.valueOf())
        };
    }

    private async readCharacteristic<T>(
        muTagPeripheralId: MuTagPeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        return await this.bluetooth.read(muTagPeripheralId, characteristic);
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
            MuTagBLEGATT.MuTagConfiguration.Major
        );
        const minor = await this.readCharacteristic(
            muTagPeripheralId,
            MuTagBLEGATT.MuTagConfiguration.Minor
        );
        if (major == null || minor == null) {
            throw Error(
                `Mu tag provisioning is invalid (peripheral ID: ${muTagPeripheralId}).`
            );
        }
        return MuTagDevices.getMuTagProvisionIdFromMajorMinor(major, minor);
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
}
