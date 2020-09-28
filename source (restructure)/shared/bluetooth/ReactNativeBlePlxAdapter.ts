import Bluetooth, {
    Peripheral,
    ScanMode,
    PeripheralId,
    BluetoothError,
    BluetoothErrorType
} from "./Bluetooth";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import {
    BleManager,
    ScanOptions,
    Device,
    ConnectionOptions,
    fullUUID
} from "react-native-ble-plx";
import { Millisecond, Rssi } from "../metaLanguage/Types";
import { Buffer } from "buffer";
import { distinct, skip } from "rxjs/operators";

enum ScanState {
    Started,
    Stopped
}

export default class ReactNativeBlePlxAdapter implements Bluetooth {
    //
    // Public instance interface

    constructor(reactNativeBlePlx: BleManager, fullUuid: typeof fullUUID) {
        this.bleManager = reactNativeBlePlx;
        this.fullUuid = fullUuid;
    }

    connect(
        peripheralId: PeripheralId,
        timeout = 30000 as Millisecond
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
                .catch(e => subscriber.error(e));
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

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T> {
        const deviceCharacteristic = await this.bleManager.readCharacteristicForDevice(
            peripheralId,
            this.fullUuid(characteristic.serviceUuid),
            this.fullUuid(characteristic.uuid)
        );
        const value =
            deviceCharacteristic.value == null ||
            deviceCharacteristic.value.length === 0
                ? undefined
                : deviceCharacteristic.value;
        return characteristic.fromBase64(value);
    }

    startScan(
        serviceUuids: string[],
        timeout?: Millisecond,
        scanMode: ScanMode = ScanMode.Balanced
    ): Observable<Peripheral> {
        if (this.scanState.value === ScanState.Started) {
            const error = new BluetoothError(
                BluetoothErrorType.ScanAlreadyStarted
            );
            return throwError(error);
        }
        this.scanState.next(ScanState.Started);
        const options: ScanOptions = {
            scanMode: scanMode as number
        };
        return new Observable<Peripheral>(subscriber => {
            const subscription = this.onScanStateChange.subscribe(() => {
                subscriber.complete();
            });
            this.bleManager.startDeviceScan(
                serviceUuids,
                options,
                (error, device) => {
                    if (error != null) {
                        subscriber.error(error);
                    } else if (device != null) {
                        const peripheral = This.toPeripheral(device);
                        subscriber.next(peripheral);
                    }
                }
            );
            let timeoutId: NodeJS.Timeout | undefined;
            if (timeout != null) {
                timeoutId = setTimeout(() => {
                    this.stopScan();
                }, timeout);
            }
            const teardown = () => {
                if (timeoutId != null) {
                    clearTimeout(timeoutId);
                }
                subscription.unsubscribe();
                if (this.scanState.value === ScanState.Started) {
                    this.scanState.next(ScanState.Stopped);
                }
            };
            return teardown;
        });
    }

    async stopScan(): Promise<void> {
        if (this.scanState.value === ScanState.Stopped) {
            return;
        }
        this.bleManager.stopDeviceScan();
        this.scanState.next(ScanState.Stopped);
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        const base64Value = characteristic.toBase64(value);
        const serviceUuid = this.fullUuid(characteristic.serviceUuid);
        const characteristicUuid = this.fullUuid(characteristic.uuid);
        if (characteristic.withResponse) {
            await this.bleManager.writeCharacteristicWithResponseForDevice(
                peripheralId,
                serviceUuid,
                characteristicUuid,
                base64Value
            );
        } else {
            await this.bleManager.writeCharacteristicWithoutResponseForDevice(
                peripheralId,
                serviceUuid,
                characteristicUuid,
                base64Value
            );
        }
    }

    // Protected instance interface

    // Private instance interface

    private bleManager: BleManager;
    private scanState = new BehaviorSubject<ScanState>(ScanState.Stopped);
    private onScanStateChange = this.scanState.pipe(distinct(), skip(1));

    private fullUuid: typeof fullUUID;

    // Public static interface

    // Protected static interface

    // Private static interface

    private static toPeripheral(device: Device): Peripheral {
        // react-native-ble-manager includes 5 extra bytes at the beginning of
        // the manufacturing data compared to react-native-ble-plx. For
        // interface interoperability we must add a 5-byte padding.

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
