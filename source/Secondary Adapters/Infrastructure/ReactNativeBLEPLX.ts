import { BleManager, ScanOptions, Device, fullUUID, BleError, BleErrorCode, BleATTErrorCode, BleAndroidErrorCode } from 'react-native-ble-plx';
import { Bluetooth } from '../../Core/Ports/Bluetooth';
import { RSSI } from '../../Core/Domain/Types';
import UnprovisionedMuTag from '../../Core/Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../../Core/Domain/ProvisionedMuTag';
import { MuTagBLEGATT } from '../../Core/Domain/MuTagBLEGATT/MuTagBLEGATT';
import UUIDGenerator from 'react-native-uuid-generator';
import Percent from '../../Core/Domain/Percent';
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic,
} from '../../Core/Domain/MuTagBLEGATT/Characteristic';

enum ProvisionState {
    Provisioned,
    Unprovisioned,
}

type MuTagUID = string & { readonly _: unique symbol };
type DeviceID = string & { readonly _: unique symbol };

export class ReactNativeBLEPLX implements Bluetooth {

    private manager: BleManager;

    private isConnectingToNewMuTag = false;
    private rejectFindUnprovisionedMuTag?: (reason?: any) => void;
    private ignoredDeviceIDCache = new Set<DeviceID>();
    private muTagDeviceIDCache = new Map<DeviceID, MuTagUID>();
    private provisionedMuTagCache = new Map<MuTagUID, DeviceID>();
    private unprovisionedMuTagCache = new Map<MuTagUID, DeviceID>();

    constructor() {
        this.manager = new BleManager();
    }

    async connectToNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        if (this.isConnectingToNewMuTag) {
            throw Error('connectToNewMuTag is already running.');
        }

        this.isConnectingToNewMuTag = true;

        const unprovisionedMuTag = await this.findUnprovisionedMuTag(scanThreshold);
        await this.cancelConnectToNewMuTag();

        return unprovisionedMuTag;
    }

    async cancelConnectToNewMuTag(): Promise<void> {
        if (this.isConnectingToNewMuTag) {
            this.manager.stopDeviceScan();

            if (this.rejectFindUnprovisionedMuTag != null) {
                const error = Error('connectToNewMuTag was canceled.');
                this.rejectFindUnprovisionedMuTag(error);
            }

            this.isConnectingToNewMuTag = false;
        }
    }

    async provisionMuTag(muTag: UnprovisionedMuTag, name: string): Promise<ProvisionedMuTag> {
        throw new Error('Method not implemented.');
    }

    private async findUnprovisionedMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        return new Promise((resolve, reject): void => {
            this.rejectFindUnprovisionedMuTag = reject;

            this.connectToMuTagDevices(scanThreshold, (muTagDevice): void => {
                ReactNativeBLEPLX.authenticateToMuTag(muTagDevice).then((): Promise<ProvisionState> => {
                    return this.discoverProvisioning(muTagDevice);
                }).then((provisionState): Promise<UnprovisionedMuTag> | undefined => {
                    if (provisionState === ProvisionState.Unprovisioned) {
                        return this.createUnprovisionedMuTag(muTagDevice);
                    }
                }).then((unprovisionedMuTag): void => {
                    muTagDevice.cancelConnection();

                    if (unprovisionedMuTag != null) {
                        this.rejectFindUnprovisionedMuTag = undefined;
                        resolve(unprovisionedMuTag);
                    }
                }).catch((error): void => {
                    this.rejectFindUnprovisionedMuTag = undefined;
                    reject(error);
                });
            });
        });
    }

    private connectToMuTagDevices(
        scanThreshold: RSSI,
        callback: (muTagDevice: Device) => void
    ): void {
        const scanOptions: ScanOptions = { scanMode: 2 };
        const discoveryCache = new Set<DeviceID>();

        this.manager.startDeviceScan(null, scanOptions, (error, device): void => {
            if (error != null) {
                throw error;
            }

            if (device == null) {
                return;
            }

            const deviceID = device.id as DeviceID;

            if (
                discoveryCache.has(deviceID)
                || this.ignoredDeviceIDCache.has(deviceID)
                || this.muTagDeviceIDCache.has(deviceID)
                || device.rssi == null
                || device.rssi < scanThreshold
            ) {
                return;
            }

            discoveryCache.add(deviceID);

            device.connect().then((): Promise<boolean> => {
                return ReactNativeBLEPLX.isMuTag(device);
            }).then((isMuTag): void => {
                if (isMuTag) {
                    callback(device);
                } else {
                    device.cancelConnection();
                    this.ignoredDeviceIDCache.add(deviceID);
                }
            }).catch((e): void => {
                if (e instanceof BleError) {
                    console.log(e);
                } else {
                    console.warn(e);
                }
            });
        });
    }

    private async discoverProvisioning(device: Device): Promise<ProvisionState> {
        const major = await ReactNativeBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.Major);
        const minor = await ReactNativeBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.Minor);
        const deviceID = device.id as DeviceID;

        if (major === undefined && minor === undefined) {
            const muTagUID = await UUIDGenerator.getRandomUUID() as MuTagUID;
            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.unprovisionedMuTagCache.set(muTagUID, deviceID);

            return ProvisionState.Unprovisioned;
        } else {
            const deviceUUID = await ReactNativeBLEPLX
                .readCharacteristic(device, MuTagBLEGATT.MuTagConfiguration.DeviceUUID);
            const muTagUID = deviceUUID as MuTagUID;

            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.provisionedMuTagCache.set(muTagUID, deviceID);

            return ProvisionState.Provisioned;
        }
    }

    private async createUnprovisionedMuTag(device: Device): Promise<UnprovisionedMuTag> {
        const batteryLevelValue = await ReactNativeBLEPLX
            .readCharacteristic(device, MuTagBLEGATT.DeviceInformation.BatteryLevel);
        const batteryLevel = new Percent(batteryLevelValue);
        const muTagUID = this.muTagDeviceIDCache.get(device.id as DeviceID);

        if (muTagUID == null) {
            throw Error('Mu tag UID not found in cache.');
        }

        return new UnprovisionedMuTag(muTagUID, batteryLevel);
    }

    private async getDeviceFromID(deviceID: DeviceID): Promise<Device> {
        const deviceArray = await this.manager.devices([deviceID]);
        const devices = new Map(
            deviceArray.map((device): [string, Device] => [device.id, device])
        );
        const device = devices.get(deviceID);

        if (device == null) {
            throw Error('Mu tag device not found.');
        }

        return device;
    }

    private static async isMuTag(device: Device): Promise<boolean> {
        await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();
        const serviceUUIDs = new Set(services.map((service): string => service.uuid));

        return serviceUUIDs.has(fullUUID(MuTagBLEGATT.MuTagConfiguration.uuid));
    }

    private static async authenticateToMuTag(device: Device): Promise<void> {
        const authenticate = MuTagBLEGATT.MuTagConfiguration.Authenticate;
        await ReactNativeBLEPLX
            .writeCharacteristic(device, authenticate, authenticate.authKey);
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
