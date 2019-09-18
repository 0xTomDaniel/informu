import { BleManager, ScanOptions, Device } from 'react-native-ble-plx';
import { Bluetooth } from '../../Core/Ports/Bluetooth';
import { RSSI } from '../../Core/Domain/Types';
import UnprovisionedMuTag from '../../Core/Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../../Core/Domain/ProvisionedMuTag';
import { MuTagBLEGATT } from '../../Core/Domain/MuTagBLEGATT/MuTagBLEGATT';
import UUIDGenerator from 'react-native-uuid-generator';
import Percent from '../../Core/Domain/Percent';
import { Buffer } from 'buffer';

enum ProvisionState {
    Provisioned,
    Unprovisioned,
}

type MuTagUID = string & { readonly _: unique symbol };
type DeviceID = string & { readonly _: unique symbol };

export class ReactNativeBLEPLX implements Bluetooth {

    private static toNumber(base64: string): number {
        const bytes = Buffer.from(base64, 'base64');
        return bytes.readIntBE(0, bytes.byteLength);
    }

    private static toString(base64: string): string {
        const bytes = Buffer.from(base64, 'base64');
        return bytes.toString();
    }

    private manager: BleManager;

    private isConnectingToNewMuTag = false;
    private muTagDeviceIDCache = new Map<DeviceID, MuTagUID>();
    private provisionedMuTagCache = new Map<MuTagUID, DeviceID>();
    private unprovisionedMuTagCache = new Map<MuTagUID, DeviceID>();

    constructor() {
        this.manager = new BleManager();
    }

    async connectToNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        this.isConnectingToNewMuTag = true;

        const unprovisionedMuTag = await this.findUnprovisionedMuTag(scanThreshold);

        return unprovisionedMuTag;
    }

    async cancelConnectToNewMuTag(): Promise<void> {
        if (this.isConnectingToNewMuTag) {

        }
    }

    async provisionMuTag(muTag: UnprovisionedMuTag, name: string): Promise<ProvisionedMuTag> {
        throw new Error('Method not implemented.');
    }

    private async findUnprovisionedMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag> {
        return new Promise((resolve, reject): void => {
            this.findMuTagDevices(scanThreshold, (muTagDevice): void => {
                this.discoverProvisioning(muTagDevice)
                    .then((provisionState): Promise<UnprovisionedMuTag> | undefined => {
                        if (provisionState === ProvisionState.Unprovisioned) {
                            return this.createUnprovisionedMuTag(muTagDevice);
                        }
                    }).then((unprovisionedMuTag): void => {
                        if (unprovisionedMuTag != null) {
                            resolve(unprovisionedMuTag);
                        }
                    }).catch((error): void => {
                        reject(error);
                    });
            });
        });
    }

    private findMuTagDevices(
        scanThreshold: RSSI,
        callback: (muTagDevice: Device) => void
    ): void {
        const hasServices = [MuTagBLEGATT.MuTagConfiguration.UUID];
        const scanOptions: ScanOptions = { scanMode: 2 };

        const discoveryCache = new Set<DeviceID>();

        this.manager.startDeviceScan(hasServices, scanOptions, (error, device): void => {
            if (error != null) {
                throw error;
            }

            // DEBUG
            //
            console.log(device);

            if (
                device == null
                || device.name !== 'Informu Beacon'
                || device.rssi == null
                || device.rssi < scanThreshold
                || this.muTagDeviceIDCache.has(device.id as DeviceID)
                || discoveryCache.has(device.id as DeviceID)
            ) {
                return;
            }

            discoveryCache.add(device.id as DeviceID);
            callback(device);
        });
    }

    private async discoverProvisioning(device: Device): Promise<ProvisionState> {
        await device.connect();
        await device.discoverAllServicesAndCharacteristics();

        // TESTING
        //
        await device.cancelConnection();

        const majorCharacteristic = await device.readCharacteristicForService(
            MuTagBLEGATT.MuTagConfiguration.UUID,
            MuTagBLEGATT.MuTagConfiguration.DeviceMajor.UUID,
        );

        if (majorCharacteristic.value == null) {
            throw new Error('Major value not found.');
        }

        const major = ReactNativeBLEPLX.toNumber(majorCharacteristic.value);

        const minorCharacteristic = await device.readCharacteristicForService(
            MuTagBLEGATT.MuTagConfiguration.UUID,
            MuTagBLEGATT.MuTagConfiguration.DeviceMinor.UUID,
        );

        if (minorCharacteristic.value == null) {
            throw new Error('Minor level value not found.');
        }

        const minor = ReactNativeBLEPLX.toNumber(minorCharacteristic.value);

        const deviceID = device.id as DeviceID;

        if (major === 0 && minor === 0) {
            //await device.cancelConnection();
            const muTagUID = await UUIDGenerator.getRandomUUID() as MuTagUID;
            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.unprovisionedMuTagCache.set(muTagUID, deviceID);

            return ProvisionState.Unprovisioned;
        } else {
            const deviceUUIDCharacteristic = await device.readCharacteristicForService(
                MuTagBLEGATT.MuTagConfiguration.UUID,
                MuTagBLEGATT.MuTagConfiguration.DeviceUUID.UUID,
            );

            //await device.cancelConnection();

            if (deviceUUIDCharacteristic.value == null) {
                throw new Error('Device UUID value not found.');
            }

            const muTagUID = ReactNativeBLEPLX.toString(deviceUUIDCharacteristic.value) as MuTagUID;
            this.muTagDeviceIDCache.set(deviceID, muTagUID);
            this.provisionedMuTagCache.set(muTagUID, deviceID);

            return ProvisionState.Provisioned;
        }
    }

    private async createUnprovisionedMuTag(device: Device): Promise<UnprovisionedMuTag> {
        const batteryLevelCharacteristic = await device.readCharacteristicForService(
            MuTagBLEGATT.MuTagConfiguration.UUID,
            MuTagBLEGATT.DeviceInformation.BatteryLevel.UUID,
        );

        if (batteryLevelCharacteristic.value == null) {
            throw new Error('Battery level value not found.');
        }

        const batteryLevelNumber = ReactNativeBLEPLX.toNumber(batteryLevelCharacteristic.value);
        const batteryLevel = new Percent(batteryLevelNumber);
        const muTagUID = this.muTagDeviceIDCache.get(device.id as DeviceID);

        if (muTagUID == null) {
            throw new Error('Mu tag UID not found in cache.');
        }

        return new UnprovisionedMuTag(muTagUID, batteryLevel);
    }

    /*private async authenticateToMuTag(deviceID: DeviceId): Promise<void> {

    }*/
}
