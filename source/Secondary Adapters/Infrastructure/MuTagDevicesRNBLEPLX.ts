import { BleManager, ScanOptions, Device, fullUUID, BleError } from 'react-native-ble-plx';
import {
    MuTagDevices,
    FindNewMuTagAlreadyRunning,
    FindNewMuTagCanceled,
    UnprovisionMuTagDeviceNotFound,
    ProvisionMuTagFailed,
    NewMuTagNotFound,
    BluetoothUnsupported,
} from '../../Core/Ports/MuTagDevices';
import { RSSI } from '../../Core/Domain/Types';
import UnprovisionedMuTag from '../../Core/Domain/UnprovisionedMuTag';
import ProvisionedMuTag, { BeaconID } from '../../Core/Domain/ProvisionedMuTag';
import { MuTagBLEGATT } from '../../Core/Domain/MuTagBLEGATT/MuTagBLEGATT';
import { v4 as UUIDv4 } from 'uuid';
import Percent from '../../Core/Domain/Percent';
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic,
} from '../../Core/Domain/MuTagBLEGATT/Characteristic';
import { AccountNumber } from '../../Core/Domain/Account';
import { MuTagColor } from '../../Core/Domain/MuTag';
import { Buffer } from 'buffer';

enum ProvisionState {
    Provisioned,
    Unprovisioned,
}

type MuTagUID = string & { readonly _: unique symbol };
type DeviceID = string & { readonly _: unique symbol };

export class MuTagDevicesRNBLEPLX implements MuTagDevices {

    private static readonly muTagDeviceUUID = 'de7ec7ed1055b055c0dedefea7edfa7e';

    private manager: BleManager;

    private isFindingNewMuTag = false;
    private rejectFindUnprovisionedMuTag?: (reason?: any) => void;
    private ignoredDeviceIDCache = new Set<DeviceID>();
    private muTagDeviceIDCache = new Map<DeviceID, MuTagUID>();
    private provisionedMuTagCache = new Map<MuTagUID, Device>();
    private unprovisionedMuTagCache = new Map<MuTagUID, Device>();

    constructor() {
        this.manager = new BleManager();
    }

    async findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        if (this.isFindingNewMuTag) {
            throw new FindNewMuTagAlreadyRunning();
        }

        this.isFindingNewMuTag = true;

        try {
            const unprovisionedMuTag = await this.findUnprovisionedMuTag(scanThreshold);
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
                }
            }

            console.warn(e);
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

    async provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: AccountNumber,
        beaconID: BeaconID,
        muTagNumber: number,
        muTagName: string,
    ): Promise<ProvisionedMuTag> {
        const device = this.unprovisionedMuTagCache
            .get(unprovisionedMuTag.uid as MuTagUID);

        if (device == null) {
            throw new UnprovisionMuTagDeviceNotFound();
        }

        try {
            await device.connect();
            await device.discoverAllServicesAndCharacteristics();
            await MuTagDevicesRNBLEPLX.authenticateToMuTag(device);

            const major = MuTagDevicesRNBLEPLX.getMajor(accountNumber);
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Major,
                major,
            );
            const minor = MuTagDevicesRNBLEPLX.getMinor(accountNumber, beaconID);
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Minor,
                minor,
            );
            await MuTagDevicesRNBLEPLX.writeCharacteristic(
                device,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.provisionCode,
            );

            const muTag = new ProvisionedMuTag({
                _uid: unprovisionedMuTag.uid,
                _beaconID: beaconID,
                _muTagNumber: muTagNumber,
                _name: muTagName,
                _batteryLevel: unprovisionedMuTag.batteryLevel,
                _isSafe: true,
                _lastSeen: new Date(),
                _color: MuTagColor.MuOrange,
            });

            return muTag;
        } catch (error) {
            console.log(error);
            throw new ProvisionMuTagFailed();
        }
    }

    private async findUnprovisionedMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        return new Promise((resolve, reject): void => {
            this.rejectFindUnprovisionedMuTag = reject;

            this.connectToMuTagDevices(scanThreshold, (muTagDevice, error): void => {
                if (error != null) {
                    this.rejectFindUnprovisionedMuTag = undefined;
                    reject(error);
                }

                if (muTagDevice == null) {
                    return;
                }

                const deviceID = muTagDevice.id as DeviceID;
                if (this.muTagDeviceIDCache.has(deviceID)) {
                    const muTagUID = this.muTagDeviceIDCache.get(deviceID) as MuTagUID;
                    if (this.provisionedMuTagCache.has(muTagUID)) {
                        return;
                    }
                }

                MuTagDevicesRNBLEPLX.authenticateToMuTag(muTagDevice).then((): Promise<ProvisionState> => {
                    return this.discoverProvisioning(muTagDevice);
                }).then((provisionState): Promise<UnprovisionedMuTag | undefined> => {
                    if (provisionState === ProvisionState.Unprovisioned) {
                        return this.createUnprovisionedMuTag(muTagDevice);
                    }

                    return Promise.resolve(undefined);
                }).then((unprovisionedMuTag): void => {
                    muTagDevice.cancelConnection();

                    if (unprovisionedMuTag != null) {
                        this.rejectFindUnprovisionedMuTag = undefined;
                        resolve(unprovisionedMuTag);
                    }
                }).catch((e): void => {
                    this.rejectFindUnprovisionedMuTag = undefined;
                    reject(e);
                });
            });
        });
    }

    private connectToMuTagDevices(
        scanThreshold: RSSI,
        callback: (muTagDevice?: Device, error?: BleError) => void
    ): void {
        const scanOptions: ScanOptions = {
            scanMode: 2, // ScanMode.LowLatency
            allowDuplicates: false, // iOS only
        };
        const discoveryCache = new Set<DeviceID>();

        this.manager.startDeviceScan(null, scanOptions, (error, device): void => {
            if (error != null) {
                callback(undefined, error);
            }

            if (device == null) {
                return;
            }

            const deviceID = device.id as DeviceID;

            if (
                discoveryCache.has(deviceID)
                || this.ignoredDeviceIDCache.has(deviceID)
                || device.rssi == null
                || device.rssi < scanThreshold
            ) {
                return;
            }

            discoveryCache.add(deviceID);

            if (!MuTagDevicesRNBLEPLX.isMuTag(device)) {
                this.ignoredDeviceIDCache.add(deviceID);
                return;
            }

            device.connect().then((): Promise<Device> => {
                return device.discoverAllServicesAndCharacteristics();
            }).then((muTagDevice): void => {
                callback(muTagDevice);
            }).catch((e): void => {
                console.warn(e);
                if (e instanceof BleError) {
                    switch (e.errorCode) {
                        case 201: // BleErrorCode.DeviceDisconnected
                        case 300: // BleErrorCode.ServicesDiscoveryFailed
                            console.log(`Removing ${deviceID} from discovery cache.`);
                            discoveryCache.delete(deviceID);
                            break;
                    }
                }
            });
        });
    }

    private async discoverProvisioning(device: Device): Promise<ProvisionState> {
        const major = await MuTagDevicesRNBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.Major);
        const minor = await MuTagDevicesRNBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.Minor);
        const deviceID = device.id as DeviceID;

        if (major === undefined && minor === undefined) {
            const muTagUID = UUIDv4() as MuTagUID;
            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.unprovisionedMuTagCache.set(muTagUID, device);

            return ProvisionState.Unprovisioned;
        } else {
            const deviceUUID = await MuTagDevicesRNBLEPLX
                .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.DeviceUUID);
            const muTagUID = deviceUUID as MuTagUID;

            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.provisionedMuTagCache.set(muTagUID, device);

            return ProvisionState.Provisioned;
        }
    }

    private async createUnprovisionedMuTag(device: Device): Promise<UnprovisionedMuTag> {
        const batteryLevelValue = await MuTagDevicesRNBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.DeviceInformation.BatteryLevel);
        const batteryLevel = new Percent(batteryLevelValue);
        const muTagUID = this.muTagDeviceIDCache.get(device.id as DeviceID);

        if (muTagUID == null) {
            throw Error(`Mu tag UID not found for device ${device.id}.`);
        }

        return new UnprovisionedMuTag(muTagUID, batteryLevel);
    }

    private static isMuTag(device: Device): boolean {
        const deviceUUID = this.getDeviceUUID(device)
        return deviceUUID === this.muTagDeviceUUID;
    }

    private static getDeviceUUID(device: Device): string | undefined {
        if (device.manufacturerData == null) {
            return;
        }
        const bytes = Buffer.from(device.manufacturerData, 'base64');
        if (bytes.length !== 25) {
            return;
        }
        return bytes.toString('hex').substring(8, 40);
    }

    private static getMajor(accountNumber: AccountNumber): number {
        const majorHex = accountNumber.toString().substr(0, 4);
        return parseInt(majorHex, 16);
    }

    private static getMinor(accountNumber: AccountNumber, beaconID: BeaconID): number {
        const majorMinorHex = accountNumber.toString() + beaconID.toString();
        const minorHex = majorMinorHex.toString().substr(4, 4);
        return parseInt(minorHex, 16);
    }

    /*private static async isMuTag(device: Device): Promise<boolean> {
        await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();
        const serviceUUIDs = new Set(services.map((service): string => service.uuid));

        return serviceUUIDs.has(fullUUID(MuTagBLEGATT.MuTagConfiguration.uuid));
    }*/

    private static async authenticateToMuTag(device: Device): Promise<void> {
        const authenticate = MuTagBLEGATT.MuTagConfiguration.Authenticate;
        await MuTagDevicesRNBLEPLX
            .writeCharacteristic(device, authenticate, authenticate.authCode);
    }

    private static async readCharacteristic<T>(
        device: Device,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>,
    ): Promise<T> {
        const deviceCharacteristic = await device.readCharacteristicForService(
            fullUUID(characteristic.serviceUUID),
            fullUUID(characteristic.uuid),
        );

        return characteristic.fromBase64(deviceCharacteristic.value || undefined);
    }

    private static async writeCharacteristic<T>(
        device: Device,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T,
    ): Promise<void> {
        const base64Value = characteristic.toBase64(value);

        if (characteristic.withResponse) {
            await device.writeCharacteristicWithResponseForService(
                fullUUID(characteristic.serviceUUID),
                fullUUID(characteristic.uuid),
                base64Value,
            );
        } else {
            await device.writeCharacteristicWithoutResponseForService(
                fullUUID(characteristic.serviceUUID),
                fullUUID(characteristic.uuid),
                base64Value,
            );
        }
    }
}
