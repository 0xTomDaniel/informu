import {
    BleManager,
    ScanOptions,
    Device,
    fullUUID,
    BleError
} from "react-native-ble-plx";
import MuTagDevicesPort, {
    /*FindNewMuTagAlreadyRunning,
    FindNewMuTagCanceled,
    UnprovisionMuTagDeviceNotFound,
    ProvisionMuTagFailed,
    NewMuTagNotFound,
    BluetoothUnsupported,
    InvalidProvisioning,
    MuTagNotFound,
    BluetoothPoweredOff,*/
    TXPowerSetting
} from "../../useCases/addMuTag/MuTagDevicesPort";
import { Rssi } from "../metaLanguage/Types";
//import UnprovisionedMuTag from "../../../source/Core/Domain/UnprovisionedMuTag";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagBLEGATT } from "./MuTagBLEGATT/MuTagBLEGATT";
import { v4 as UUIDv4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { Buffer } from "buffer";
import Hexadecimal from "../../../source/Core/Domain/Hexadecimal";

export class UnprovisionMuTagDeviceNotFound extends Error {
    constructor() {
        super("Could not find new Mu tag. Please scan for new Mu tag again.");
        this.name = "UnprovisionMuTagDeviceNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BluetoothUnsupported extends Error {
    constructor() {
        super(
            "This device doesn't support Bluetooth. Mu tags cannot be added."
        );
        this.name = "BluetoothUnsupported";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BluetoothPoweredOff extends Error {
    constructor() {
        super("Bluetooth is powered off. Please turn it on and try again.");
        this.name = "BluetoothPoweredOff";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NewMuTagNotFound extends Error {
    constructor() {
        super(
            "Could not find new Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app."
        );
        this.name = "NewMuTagNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ProvisionMuTagFailed extends Error {
    constructor() {
        super(
            "Failed to add Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app."
        );
        this.name = "ProvisionMuTagFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class UnprovisionMuTagFailed extends Error {
    constructor() {
        super(
            "Failed to remove Mu tag. Please ensure the Mu tag is charged and move it closer to the app."
        );
        this.name = "UnprovisionMuTagFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagAlreadyRunning extends Error {
    constructor() {
        super("Already searching for new Mu tag.");
        this.name = "FindNewMuTagAlreadyRunning";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagCanceled extends Error {
    constructor() {
        super("Find new Mu tag was canceled.");
        this.name = "FindNewMuTagCanceled";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MuTagNotFound extends Error {
    constructor() {
        super(
            "Could not find Mu tag. Please ensure the Mu tag is charged and move it closer to the app."
        );
        this.name = "MuTagNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class InvalidProvisioning extends Error {
    constructor() {
        super(
            "Mu tag provisioning is invalid. Please contact customer support."
        );
        this.name = "InvalidProvisioning";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MuTagNotFoundInUnprovisionedCache extends Error {
    constructor() {
        super("Could not find Mu tag in unprovisioned cache.");
        this.name = "MuTagNotFoundInUnprovisionedCache";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MuTagNotFoundInProvisionedCache extends Error {
    constructor() {
        super("Could not find Mu tag in provisioned cache.");
        this.name = "MuTagNotFoundInUnprovisionedCache";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

enum ProvisionState {
    Provisioned,
    Unprovisioned
}

type ProvisionID = string & { readonly _: unique symbol };
type MuTagUID = string & { readonly _: unique symbol };
type DeviceID = string & { readonly _: unique symbol };

export class MuTagDevicesRNBLEPLX implements MuTagDevicesPort {
    private static readonly muTagDeviceUUID =
        "de7ec7ed1055b055c0dedefea7edfa7e";

    private manager: BleManager;

    private isFindingNewMuTag = false;
    private rejectFindUnprovisionedMuTag?: (reason?: any) => void;
    private ignoredDeviceIDCache = new Set<DeviceID>();
    private muTagUIDCache = new Map<DeviceID, MuTagUID>();
    private muTagProvisionIDCache = new Map<DeviceID, ProvisionID>();
    private provisionedMuTagCache = new Map<ProvisionID, Device>();
    private unprovisionedMuTagCache = new Map<MuTagUID, Device>();

    constructor() {
        this.manager = new BleManager();
    }

    async findNewMuTag(scanThreshold: Rssi): Promise<any> {
        if (this.isFindingNewMuTag) {
            throw new FindNewMuTagAlreadyRunning();
        }

        this.isFindingNewMuTag = true;

        try {
            const unprovisionedMuTag = await this.findUnprovisionedMuTag(
                scanThreshold
            );
            this.cancelFindNewMuTag();
            return unprovisionedMuTag;
        } catch (e) {
            if (e instanceof FindNewMuTagCanceled) {
                throw e;
            }

            this.cancelFindNewMuTag();

            if (e instanceof BleError) {
                switch (e.errorCode) {
                    case 100: // BleErrorCode.BluetoothUnsupported
                        throw new BluetoothUnsupported();
                    case 102: // BleErrorCode.BluetoothPoweredOff
                        throw new BluetoothPoweredOff();
                }
            }

            console.warn(`findNewMuTag(): ${e}`);
            throw new NewMuTagNotFound();
        }
    }

    cancelFindNewMuTag(): void {
        if (this.isFindingNewMuTag) {
            this.manager.stopDeviceScan();

            if (this.rejectFindUnprovisionedMuTag != null) {
                const error = new FindNewMuTagCanceled();
                this.rejectFindUnprovisionedMuTag(error);
            }

            this.isFindingNewMuTag = false;
        }
    }

    async connectToProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Promise<void> {
        let muTagDevice: Device | undefined;

        try {
            muTagDevice = await this.getProvisionedMuTagDevice(
                accountNumber,
                beaconID
            );
            const isConnected = await muTagDevice.isConnected();
            if (!isConnected) {
                await muTagDevice.connect();
                await muTagDevice.discoverAllServicesAndCharacteristics();
            }
            await MuTagDevicesRNBLEPLX.authenticateToMuTag(muTagDevice);
        } catch (e) {
            if (muTagDevice != null) {
                muTagDevice.cancelConnection().catch((error): void => {
                    console.warn(
                        `connect() - muTagDevice.cancelConnection() - error: ${error}`
                    );
                });
            }

            console.warn(`connect() - error: ${e}`);

            throw new MuTagNotFound();
        }
    }

    disconnectFromProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): void {
        this.getProvisionedMuTagDevice(accountNumber, beaconID)
            .then(
                (muTagDevice): Promise<Device> => {
                    return muTagDevice.cancelConnection();
                }
            )
            .catch((e): void => {
                console.warn(`disconnect() - error: ${e}`);
            });
    }

    async provisionMuTag(
        unprovisionedMuTag: any,
        accountNumber: AccountNumber,
        beaconID: BeaconId,
        muTagNumber: number,
        muTagName: string
    ): Promise<ProvisionedMuTag> {
        const device = this.unprovisionedMuTagCache.get(
            unprovisionedMuTag.uid as MuTagUID
        );

        if (device == null) {
            throw new UnprovisionMuTagDeviceNotFound();
        }

        try {
            const isConnected = await device.isConnected();
            if (!isConnected) {
                await device.connect();
                await device.discoverAllServicesAndCharacteristics();
            }

            await MuTagDevicesRNBLEPLX.authenticateToMuTag(device);

            const major = MuTagDevicesRNBLEPLX.getMajor(accountNumber);
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Major,
                major
            );
            const minor = MuTagDevicesRNBLEPLX.getMinor(
                accountNumber,
                beaconID
            );
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Minor,
                minor
            );
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.provisionCode
            );
            await device.cancelConnection();

            this.moveToProvisionedCache(
                device.id as DeviceID,
                accountNumber,
                beaconID
            );

            const muTag = new ProvisionedMuTag({
                _uid: unprovisionedMuTag.uid,
                _beaconID: beaconID,
                _muTagNumber: muTagNumber,
                _name: muTagName,
                _batteryLevel: unprovisionedMuTag.batteryLevel,
                _isSafe: true,
                _lastSeen: new Date(),
                _color: MuTagColor.MuOrange
            });

            return muTag;
        } catch (error) {
            console.log(error);
            throw new ProvisionMuTagFailed();
        }
    }

    async unprovisionMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Promise<void> {
        const muTagDevice = await this.getProvisionedMuTagDevice(
            accountNumber,
            beaconID
        );
        const transactionID = UUIDv4();

        return new Promise((resolve): void => {
            MuTagDevicesRNBLEPLX.writeCharacteristic(
                muTagDevice,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.unprovisionCode,
                transactionID
            ).catch((e): void => {
                console.warn(`writeCharacteristic() - error: ${e}`);

                muTagDevice.cancelConnection().catch((error): void => {
                    console.warn(
                        `writeCharacteristic() - cancelConnection() - error: ${error}`
                    );
                });
                this.removeFromProvisionedCache(muTagDevice.id as DeviceID);
                resolve();
            });

            // Tested with 1ms and unprovisioning still works. Using 250ms to be
            // safe from zombied Mu tags.
            const unprovisionTimeoutMS = 250;
            setTimeout((): void => {
                this.manager.cancelTransaction(transactionID);
            }, unprovisionTimeoutMS);
        });
    }

    async readBatteryLevel(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Promise<Percent> {
        const muTagDevice = await this.getProvisionedMuTagDevice(
            accountNumber,
            beaconID
        );
        const batteryLevel = await MuTagDevicesRNBLEPLX.readCharacteristic(
            muTagDevice,
            MuTagBLEGATT.DeviceInformation.BatteryLevel
        );
        return new Percent(batteryLevel.valueOf());
    }

    async changeTXPower(
        txPower: TXPowerSetting,
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Promise<void> {
        const muTagDevice = await this.getProvisionedMuTagDevice(
            accountNumber,
            beaconID
        );
        let txPowerHex: Hexadecimal;
        switch (txPower) {
            case TXPowerSetting["+6 dBm"]:
                txPowerHex = Hexadecimal.fromString("01");
                break;
            case TXPowerSetting["0 dBm"]:
                txPowerHex = Hexadecimal.fromString("02");
                break;
            case TXPowerSetting["-8 dBm"]:
                txPowerHex = Hexadecimal.fromString("03");
                break;
            case TXPowerSetting["-15 dBm"]:
                txPowerHex = Hexadecimal.fromString("04");
                break;
            case TXPowerSetting["-20 dBm"]:
                txPowerHex = Hexadecimal.fromString("05");
                break;
        }
        await MuTagDevicesRNBLEPLX.writeCharacteristic(
            muTagDevice,
            MuTagBLEGATT.MuTagConfiguration.TXPower,
            txPowerHex
        );
    }

    private moveToProvisionedCache(
        deviceID: DeviceID,
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): void {
        const uid = this.muTagUIDCache.get(deviceID);
        if (uid == null) {
            throw new MuTagNotFoundInUnprovisionedCache();
        }

        const device = this.unprovisionedMuTagCache.get(uid);
        if (device == null) {
            throw new MuTagNotFoundInUnprovisionedCache();
        }

        const provisionID = MuTagDevicesRNBLEPLX.getProvisionID(
            accountNumber,
            beaconID
        );
        this.muTagProvisionIDCache.set(deviceID, provisionID);
        this.provisionedMuTagCache.set(provisionID, device);
        this.muTagUIDCache.delete(deviceID);
        this.unprovisionedMuTagCache.delete(uid);
    }

    private removeFromProvisionedCache(deviceID: DeviceID): void {
        const provisionID = this.muTagProvisionIDCache.get(deviceID);
        if (provisionID == null) {
            throw new MuTagNotFoundInProvisionedCache();
        }

        this.muTagProvisionIDCache.delete(deviceID);
        this.provisionedMuTagCache.delete(provisionID);
    }

    private async getProvisionedMuTagDevice(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Promise<Device> {
        let muTagDevice: Device | undefined;
        const provisionID = MuTagDevicesRNBLEPLX.getProvisionID(
            accountNumber,
            beaconID
        );

        muTagDevice = this.provisionedMuTagCache.get(provisionID);

        if (muTagDevice == null) {
            muTagDevice = await this.findProvisionedMuTag(provisionID);
        }

        return muTagDevice;
    }

    private async findUnprovisionedMuTag(scanThreshold: Rssi): Promise<any> {
        return new Promise((resolve, reject): void => {
            this.rejectFindUnprovisionedMuTag = reject;

            this.connectToMuTagDevices(
                scanThreshold,
                (muTagDevice, error): void => {
                    if (error != null) {
                        this.rejectFindUnprovisionedMuTag = undefined;
                        reject(error);
                    }

                    if (muTagDevice == null) {
                        return;
                    }

                    const deviceID = muTagDevice.id as DeviceID;
                    if (this.muTagProvisionIDCache.has(deviceID)) {
                        muTagDevice.cancelConnection();
                        return;
                    }

                    MuTagDevicesRNBLEPLX.authenticateToMuTag(muTagDevice)
                        .then(
                            (): Promise<ProvisionState> => {
                                return this.discoverProvisioning(muTagDevice);
                            }
                        )
                        .then(
                            (provisionState): Promise<any | undefined> => {
                                if (
                                    provisionState ===
                                    ProvisionState.Unprovisioned
                                ) {
                                    return this.createUnprovisionedMuTag(
                                        muTagDevice
                                    );
                                }

                                return Promise.resolve(undefined);
                            }
                        )
                        .then((unprovisionedMuTag): void => {
                            muTagDevice.cancelConnection();

                            if (unprovisionedMuTag != null) {
                                this.rejectFindUnprovisionedMuTag = undefined;
                                resolve(unprovisionedMuTag);
                            }
                        })
                        .catch((e): void => {
                            this.rejectFindUnprovisionedMuTag = undefined;
                            reject(e);
                        });
                }
            );
        });
    }

    private async findProvisionedMuTag(
        provisionID: ProvisionID
    ): Promise<Device> {
        return new Promise((resolve, reject): void => {
            const scanThreshold = -90 as Rssi;
            this.connectToMuTagDevices(
                scanThreshold,
                (muTagDevice, error): void => {
                    if (error != null) {
                        reject(error);
                    }

                    if (muTagDevice == null) {
                        return;
                    }

                    const deviceID = muTagDevice.id as DeviceID;
                    if (this.muTagProvisionIDCache.has(deviceID)) {
                        return;
                    }

                    MuTagDevicesRNBLEPLX.authenticateToMuTag(muTagDevice)
                        .then(
                            (): Promise<ProvisionState> => {
                                return this.discoverProvisioning(muTagDevice);
                            }
                        )
                        .then(
                            (provisionState): Promise<Device | undefined> => {
                                const connectedProvisionID = this.muTagProvisionIDCache.get(
                                    deviceID
                                );

                                if (
                                    provisionState ===
                                        ProvisionState.Unprovisioned ||
                                    connectedProvisionID !== provisionID
                                ) {
                                    return Promise.resolve(undefined);
                                }

                                this.manager.stopDeviceScan();
                                return muTagDevice.cancelConnection();
                            }
                        )
                        .then((device): void => {
                            if (device != null) {
                                resolve(device);
                            }
                        })
                        .catch((e): void => {
                            reject(e);
                        });
                }
            );
        });
    }

    private connectToMuTagDevices(
        scanThreshold: Rssi,
        callback: (muTagDevice?: Device, error?: BleError) => void
    ): void {
        const scanOptions: ScanOptions = {
            scanMode: 2, // ScanMode.LowLatency
            allowDuplicates: false // iOS only
        };
        const discoveryCache = new Set<DeviceID>();

        this.manager.startDeviceScan(
            null,
            scanOptions,
            (error, device): void => {
                if (error != null) {
                    callback(undefined, error);
                }

                if (device == null) {
                    return;
                }

                const deviceID = device.id as DeviceID;

                if (
                    discoveryCache.has(deviceID) ||
                    this.ignoredDeviceIDCache.has(deviceID) ||
                    device.rssi == null ||
                    device.rssi < scanThreshold
                ) {
                    return;
                }

                discoveryCache.add(deviceID);

                if (!MuTagDevicesRNBLEPLX.isMuTag(device)) {
                    this.ignoredDeviceIDCache.add(deviceID);
                    return;
                }

                device
                    .connect()
                    .then(
                        (): Promise<Device> => {
                            return device.discoverAllServicesAndCharacteristics();
                        }
                    )
                    .then((muTagDevice): void => {
                        callback(muTagDevice);
                    })
                    .catch((e): void => {
                        console.warn(`connectToMuTagDevices(): ${e}`);
                        if (e instanceof BleError) {
                            switch (e.errorCode) {
                                case 201: // BleErrorCode.DeviceDisconnected
                                case 300: // BleErrorCode.ServicesDiscoveryFailed
                                    console.log(
                                        `Removing ${deviceID} from discovery cache.`
                                    );
                                    discoveryCache.delete(deviceID);
                                    break;
                                case 203: // BleErrorCode.DeviceAlreadyConnected
                                    callback(device);
                                    break;
                            }
                        }
                    });
            }
        );
    }

    private async discoverProvisioning(
        device: Device
    ): Promise<ProvisionState> {
        const provisioned = await MuTagDevicesRNBLEPLX.readCharacteristic(
            device,
            MuTagBLEGATT.MuTagConfiguration.Provision
        );
        const deviceID = device.id as DeviceID;

        if (provisioned === undefined) {
            const muTagUID = UUIDv4() as MuTagUID;
            this.muTagUIDCache.set(deviceID, muTagUID);
            this.unprovisionedMuTagCache.set(muTagUID, device);

            return ProvisionState.Unprovisioned;
        } else {
            const major = await MuTagDevicesRNBLEPLX.readCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Major
            );
            const minor = await MuTagDevicesRNBLEPLX.readCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Minor
            );

            if (major == null || minor == null) {
                throw new InvalidProvisioning();
            }

            const provisionID = MuTagDevicesRNBLEPLX.getProvisionIDFromMajorMinor(
                major,
                minor
            );

            this.muTagProvisionIDCache.set(deviceID, provisionID);
            this.provisionedMuTagCache.set(provisionID, device);

            return ProvisionState.Provisioned;
        }
    }

    private async createUnprovisionedMuTag(device: Device): Promise<any> {
        const batteryLevelValue = await MuTagDevicesRNBLEPLX.readCharacteristic(
            device,
            MuTagBLEGATT.DeviceInformation.BatteryLevel
        );
        const batteryLevel = new Percent(batteryLevelValue.valueOf());
        const muTagUID = this.muTagUIDCache.get(device.id as DeviceID);

        if (muTagUID == null) {
            throw Error(`Mu tag UID not found for device ${device.id}.`);
        }

        return {}; //new UnprovisionedMuTag(muTagUID, batteryLevel);
    }

    private static isMuTag(device: Device): boolean {
        const deviceUUID = this.getDeviceUUID(device);
        return deviceUUID === this.muTagDeviceUUID;
    }

    private static getDeviceUUID(device: Device): string | undefined {
        if (device.manufacturerData == null) {
            return;
        }
        const bytes = Buffer.from(device.manufacturerData, "base64");
        if (bytes.length !== 25) {
            return;
        }
        return bytes.toString("hex").substring(8, 40);
    }

    private static getMajor(accountNumber: AccountNumber): Hexadecimal {
        const majorHexString = accountNumber.toString().substr(0, 4);
        return Hexadecimal.fromString(majorHexString);
    }

    private static getMinor(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): Hexadecimal {
        const majorMinorHex = accountNumber.toString() + beaconID.toString();
        const minorHex = majorMinorHex.toString().substr(4, 4);
        return Hexadecimal.fromString(minorHex);
    }

    private static getProvisionIDFromMajorMinor(
        major: Hexadecimal,
        minor: Hexadecimal
    ): ProvisionID {
        return (major.toString() + minor.toString()) as ProvisionID;
    }

    private static getProvisionID(
        accountNumber: AccountNumber,
        beaconID: BeaconId
    ): ProvisionID {
        return (accountNumber.toString() + beaconID.toString()) as ProvisionID;
    }

    /*private static async isMuTag(device: Device): Promise<boolean> {
        await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();
        const serviceUUIDs = new Set(services.map((service): string => service.uuid));

        return serviceUUIDs.has(fullUUID(MuTagBLEGATT.MuTagConfiguration.uuid));
    }*/

    private static async authenticateToMuTag(device: Device): Promise<void> {
        const authenticate = MuTagBLEGATT.MuTagConfiguration.Authenticate;
        await MuTagDevicesRNBLEPLX.writeCharacteristic(
            device,
            authenticate,
            authenticate.authCode
        );
    }

    private static async readCharacteristic<T>(
        device: Device,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        const deviceCharacteristic = await device.readCharacteristicForService(
            fullUUID(characteristic.serviceUuid),
            fullUUID(characteristic.uuid)
        );

        return characteristic.fromBase64(
            deviceCharacteristic.value || undefined
        );
    }

    private static async writeCharacteristic<T>(
        device: Device,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T,
        transactionId?: string
    ): Promise<void> {
        const base64Value = characteristic.toBase64(value);

        if (characteristic.withResponse) {
            await device.writeCharacteristicWithResponseForService(
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        } else {
            await device.writeCharacteristicWithoutResponseForService(
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        }
    }
}
