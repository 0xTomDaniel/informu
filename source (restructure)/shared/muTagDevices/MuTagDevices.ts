import MuTagDevicesPortAddMuTag, {
    UnprovisionedMuTag
} from "../../useCases/addMuTag/MuTagDevicesPort";
import MuTagDevicesPortRemoveMuTag from "../../useCases/removeMuTag/MuTagDevicesPort";
import Bluetooth, { Peripheral, PeripheralId } from "./Bluetooth";
import { Subscription, Subject, NEVER, from } from "rxjs";
import { switchMap, filter, mergeMap, mapTo } from "rxjs/operators";
import { Buffer } from "buffer";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Rssi } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";
import { MuTagBLEGATT } from "./MuTagBLEGATT/MuTagBLEGATT";

export class MuTagDevices
    implements MuTagDevicesPortAddMuTag, MuTagDevicesPortRemoveMuTag {
    private readonly muTagDeviceUuid = "de7ec7ed1055b055c0dedefea7edfa7e";

    private readonly bluetooth: Bluetooth;
    private discoveredPeripheralSubscription?: Subscription;
    private readonly pauseUnprovisionedMuTag = new Subject<boolean>();
    private findUnprovisionedMuTagsProximityThreshold = -90 as Rssi;
    private ignoredPeripheralCache = new Set<PeripheralId>();
    private muTagUidToPeripheralIdCache = new Map<MuTagUid, PeripheralId>();
    private peripheralIdToMuTagUidCache = new Map<PeripheralId, MuTagUid>();

    readonly unprovisionedMuTag = this.pauseUnprovisionedMuTag.pipe(
        switchMap(paused =>
            paused ? NEVER : this.bluetooth.discoveredPeripheral
        ),
        filter(
            peripheral =>
                peripheral.rssi >=
                this.findUnprovisionedMuTagsProximityThreshold
        ),
        mergeMap(peripheral =>
            from(this.isUnprovisionedMuTag(peripheral)).pipe(
                filter(Boolean),
                mapTo(peripheral)
            )
        ),
        mergeMap(async peripheral => {
            const unprovisionedMuTag = await this.createUnprovisionedMuTag(
                peripheral.id
            );
            await this.bluetooth.disconnect(peripheral.id);
            return unprovisionedMuTag;
        })
    );

    constructor(bluetooth: Bluetooth) {
        this.bluetooth = bluetooth;
    }

    destructor(): void {
        this.discoveredPeripheralSubscription?.unsubscribe();
    }

    async startFindingUnprovisionedMuTags(
        proximityThreshold: Rssi
    ): Promise<void> {
        this.findUnprovisionedMuTagsProximityThreshold = proximityThreshold;
        this.pauseUnprovisionedMuTag.next(false);
        await this.bluetooth.startScan([], 5);
    }

    stopFindingUnprovisionedMuTags(): void {
        this.pauseUnprovisionedMuTag.next(true);
    }

    provisionMuTag(
        muTagUid: MuTagUid,
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void> {}

    private async connectAndAuthenticateToMuTag(
        muTagUid: MuTagUid
    ): Promise<void> {
        const peripheralId = this.getPeripheralId(muTagUid);
        await this.bluetooth.connect(peripheralId);
        await this.authenticateToMuTag(muTagUid);
    }

    private async authenticateToMuTag(muTagUid: MuTagUid): Promise<void> {
        const peripheralId = this.getPeripheralId(muTagUid);
        const authenticate = MuTagBLEGATT.MuTagConfiguration.Authenticate;
        await this.writeCharacteristic(
            peripheralId,
            authenticate,
            authenticate.authCode
        );
    }

    private async isUnprovisionedMuTag(
        peripheral: Peripheral
    ): Promise<boolean> {
        if (!this.isMuTag(peripheral)) {
            this.ignoredPeripheralCache.add(peripheral.id);
            return false;
        }

        let muTagUid: MuTagUid;
        try {
            muTagUid = this.getMuTagUid(peripheral.id);
        } catch {
            muTagUid = this.createMuTagUid();
            this.cacheMuTagUid(muTagUid, peripheral.id);
        }

        await this.connectAndAuthenticateToMuTag(muTagUid);
        const isMuTagProvisioned = await this.isMuTagProvisioned(muTagUid);
        if (isMuTagProvisioned) {
            await this.bluetooth.disconnect(peripheral.id);
            return false;
        }
        return true;
    }

    private isMuTag(peripheral: Peripheral): boolean {
        if (this.ignoredPeripheralCache.has(peripheral.id)) {
            return false;
        }
        return this.peripheralIdToMuTagUidCache.has(peripheral.id)
            ? true
            : MuTagDevices.getDeviceUuid(peripheral) === this.muTagDeviceUuid;
    }

    private static getDeviceUuid(peripheral: Peripheral): string | undefined {
        const bytes = Buffer.from(
            peripheral.advertising.manufacturerData.bytes
        );
        return bytes.toString("hex").substring(18, 50);
    }

    private createMuTagUid(): MuTagUid {
        return uuidV4() as MuTagUid;
    }

    private cacheMuTagUid(
        muTagUid: MuTagUid,
        peripheralId: PeripheralId
    ): void {
        this.muTagUidToPeripheralIdCache.set(muTagUid, peripheralId);
        this.peripheralIdToMuTagUidCache.set(peripheralId, muTagUid);
    }

    private getMuTagUid(peripheralId: PeripheralId): MuTagUid {
        const muTagUid = this.peripheralIdToMuTagUidCache.get(peripheralId);
        if (muTagUid == null) {
            throw Error("Peripheral ID not found in cache.");
        }
        return muTagUid;
    }

    private getPeripheralId(muTagUid: MuTagUid): PeripheralId {
        const peripheralId = this.muTagUidToPeripheralIdCache.get(muTagUid);
        if (peripheralId == null) {
            throw Error("Mu tag UID not found in cache.");
        }
        return peripheralId;
    }

    private async isMuTagProvisioned(muTagUid: MuTagUid): Promise<boolean> {
        const peripheralId = this.getPeripheralId(muTagUid);
        const provisioned = await this.readCharacteristic(
            peripheralId,
            MuTagBLEGATT.MuTagConfiguration.Provision
        );
        return provisioned !== undefined;
    }

    private async createUnprovisionedMuTag(
        peripheralId: PeripheralId
    ): Promise<UnprovisionedMuTag> {
        const batteryLevelHex = await this.readCharacteristic(
            peripheralId,
            MuTagBLEGATT.DeviceInformation.BatteryLevel
        );
        const muTagUid = this.getMuTagUid(peripheralId);
        return {
            uid: muTagUid,
            batteryLevel: new Percent(batteryLevelHex.valueOf())
        };
    }

    private async readCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        return await this.bluetooth.read(peripheralId, characteristic);
    }

    private async writeCharacteristic<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.bluetooth.write(peripheralId, characteristic, value);
    }
}
