import Bluetooth, { Peripheral, ScanMode, PeripheralId } from "./Bluetooth";
import { Observable, Subject, Subscriber } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import {
    BleManager,
    ScanOptions,
    ScanMode as BleManagerScanMode,
    Device,
    fullUUID,
    State,
    ConnectionOptions
} from "react-native-ble-plx";
import { Millisecond, Rssi } from "../metaLanguage/Types";
import { Buffer } from "buffer";

export default class ReactNativeBlePlxAdapter implements Bluetooth {
    //
    // Public instance interface

    discoveredPeripheral: Observable<Peripheral>;

    constructor(reactNativeBlePlx: BleManager) {
        this.bleManager = reactNativeBlePlx;
        this.discoveredPeripheral = this.discoveredPeripheralSubject.asObservable();
    }

    connect(
        peripheralId: PeripheralId,
        timeout = 30 as Millisecond
    ): Observable<void> {
        return new Observable<void>(subscriber => {
            const subscription = this.bleManager.onDeviceDisconnected(
                peripheralId,
                error => {
                    if (error != null) {
                        subscriber.error(error);
                    } else {
                        subscriber.complete();
                    }
                }
            );
            const options: ConnectionOptions = {
                timeout: timeout
            };
            this.bleManager
                .connectToDevice(peripheralId, options)
                .then(device => device.discoverAllServicesAndCharacteristics())
                .then(() => subscriber.next())
                .catch(subscriber.error);
            const teardown = () => subscription.remove();
            return teardown;
        });
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bleManager.cancelDeviceConnection(peripheralId);
    }

    async enableBluetooth(): Promise<void> {
        await this.bleManager.enable();
    }

    read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T> {
        throw new Error("Method not implemented.");
    }

    async startScan(
        serviceUuids: string[],
        timeout: Millisecond,
        scanMode: ScanMode = ScanMode.balanced
    ): Promise<void> {
        const options: ScanOptions = {
            scanMode: scanMode as number
        };
        await new Promise((resolve, reject) => {
            let hasResolved = false;
            this.bleManager.startDeviceScan(
                serviceUuids,
                options,
                (error, device) => {
                    if (error != null) {
                        reject(error);
                    } else if (!hasResolved) {
                        hasResolved = true;
                        resolve();
                    }
                    if (device != null) {
                        const peripheral = This.toPeripheral(device);
                        this.discoveredPeripheralSubject.next(peripheral);
                    }
                }
            );
        });
    }

    async stopScan(): Promise<void> {
        this.bleManager.stopDeviceScan();
    }

    write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // Protected instance interface

    // Private instance interface

    private bleManager: BleManager;
    private discoveredPeripheralSubject = new Subject<Peripheral>();

    // Public static interface

    // Protected static interface

    // Private static interface

    private static toPeripheral(device: Device): Peripheral {
        // react-native-ble-manager includes 5 extra bytes at the beginning of
        // the manufacturing data compared to react-native-ble-plx. For
        // interface compatibility we must add a 5-byte padding.

        let manufacturerData: Buffer;

        if (device.manufacturerData != null) {
            const bytes = Buffer.from(device.manufacturerData, "base64");
            const prependBytes = Buffer.alloc(5);
            manufacturerData = Buffer.concat([prependBytes, bytes]);
        } else {
            manufacturerData = Buffer.alloc(0);
        }

        return {
            id: device.id as PeripheralId,
            name: device.name ?? "",
            rssi: device.rssi != null ? (device.rssi as Rssi) : undefined,
            advertising: {
                isConnectable: device.isConnectable ?? undefined,
                serviceUuids: device.serviceUUIDs ?? [],
                manufacturerData: manufacturerData,
                serviceData: device.serviceData ?? {},
                txPowerLevel: device.txPowerLevel ?? undefined
            }
        };
    }
}
const This = ReactNativeBlePlxAdapter;
