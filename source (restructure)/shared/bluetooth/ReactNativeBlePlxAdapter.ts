import BluetoothPort, {
    Peripheral,
    ScanMode,
    PeripheralId,
    BluetoothError
} from "./BluetoothPort";
import {
    Observable,
    BehaviorSubject,
    throwError,
    concat,
    EMPTY,
    from
} from "rxjs";
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
import { switchMap, filter, catchError } from "rxjs/operators";
import { Platform } from "react-native";

enum ScanState {
    Started,
    Stopped
}

export default class ReactNativeBlePlxAdapter implements BluetoothPort {
    //
    // Public instance interface

    constructor(
        reactNativeBlePlx: BleManager,
        fullUuid: typeof fullUUID,
        platform: typeof Platform
    ) {
        this.bleManager = reactNativeBlePlx;
        this.fullUuid = fullUuid;
        this.platform = platform;
    }

    connect(
        peripheralId: PeripheralId,
        timeout = 10000 as Millisecond
    ): Observable<void> {
        const observable = concat(
            from(this.enableBluetooth()).pipe(switchMap(() => EMPTY)),
            new Observable<void>(subscriber => {
                const subscription = this.bleManager.onDeviceDisconnected(
                    peripheralId,
                    bleError => {
                        if (bleError != null) {
                            subscriber.error(
                                BluetoothError.ConnectionLostUnexpectedly(
                                    peripheralId,
                                    bleError
                                )
                            );
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
                    .then(device =>
                        device.discoverAllServicesAndCharacteristics()
                    )
                    .then(() => subscriber.next())
                    .catch(e =>
                        subscriber.error(
                            BluetoothError.FailedToConnect(peripheralId, e)
                        )
                    );
                const teardown = () => subscription.remove();
                return teardown;
            })
        );
        return observable;
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bleManager.cancelDeviceConnection(peripheralId).catch(e => {
            throw BluetoothError.FailedToDisconnect(peripheralId, e);
        });
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T> {
        await this.enableBluetooth();
        const deviceCharacteristic = await this.bleManager
            .readCharacteristicForDevice(
                peripheralId,
                this.fullUuid(characteristic.serviceUuid),
                this.fullUuid(characteristic.uuid)
            )
            .catch(e => {
                throw BluetoothError.FailedToRead(
                    characteristic.uuid,
                    peripheralId,
                    e
                );
            });
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
            const error = BluetoothError.ScanAlreadyStarted;
            return throwError(error);
        }
        this.scanState.next(ScanState.Started);
        const options: ScanOptions = {
            scanMode: scanMode as number
        };
        const observable = concat(
            from(this.enableBluetooth()).pipe(switchMap(() => EMPTY)),
            new Observable<Peripheral>(subscriber => {
                let didTimeout = false;
                const subscription = this.onScanStateStopped.subscribe(() => {
                    if (didTimeout) {
                        subscriber.error(BluetoothError.ScanTimeout);
                    } else {
                        subscriber.complete();
                    }
                });
                this.bleManager.startDeviceScan(
                    serviceUuids,
                    options,
                    (bleError, device) => {
                        if (bleError != null) {
                            subscriber.error(
                                BluetoothError.FailedToStartScan(bleError)
                            );
                        } else if (device != null) {
                            const peripheral = This.toPeripheral(device);
                            subscriber.next(peripheral);
                        }
                    }
                );
                let timeoutId: NodeJS.Timeout | undefined;
                if (timeout != null) {
                    timeoutId = setTimeout(() => {
                        didTimeout = true;
                        this.stopScan();
                    }, timeout);
                }
                const teardown = () => {
                    if (timeoutId != null) {
                        clearTimeout(timeoutId);
                    }
                    subscription.unsubscribe();
                };
                return teardown;
            })
        ).pipe(
            catchError(e => {
                this.scanState.next(ScanState.Stopped);
                throw e;
            })
        );
        return observable;
    }

    async stopScan(): Promise<void> {
        if (this.scanState.value === ScanState.Stopped) {
            return;
        }
        try {
            this.bleManager.stopDeviceScan();
        } catch (e) {
            throw BluetoothError.FailedToStopScan(e);
        }
        this.scanState.next(ScanState.Stopped);
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.enableBluetooth();
        const base64Value = characteristic.toBase64(value);
        const serviceUuid = this.fullUuid(characteristic.serviceUuid);
        const characteristicUuid = this.fullUuid(characteristic.uuid);
        try {
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
        } catch (e) {
            let stringValue: string;
            if (typeof value === "string") {
                stringValue = value;
            } else {
                stringValue = Buffer.from(base64Value, "base64").toString(
                    "hex"
                );
            }
            throw BluetoothError.FailedToWrite(
                stringValue,
                characteristic.uuid,
                peripheralId,
                e
            );
        }
    }

    // Protected instance interface

    // Private instance interface

    private readonly bleManager: BleManager;
    private readonly fullUuid: typeof fullUUID;
    private readonly scanState = new BehaviorSubject<ScanState>(
        ScanState.Stopped
    );
    private readonly onScanStateStopped = this.scanState.pipe(
        filter(state => state === ScanState.Stopped)
    );
    private readonly platform: typeof Platform;

    private async enableBluetooth(): Promise<void> {
        const state = await this.bleManager.state();
        switch (state) {
            // TODO: Refactor switch to use State enum directly.
            // 'warnOnce' Jest bug preventing test from running when using State enum directly.
            case "PoweredOff":
                if (this.platform.OS === "ios") {
                    throw BluetoothError.BluetoothPoweredOff;
                }
                await this.bleManager.enable().catch(e => {
                    throw BluetoothError.FailedToEnableBluetooth(e);
                });
                break;
            case "Unauthorized":
                if (this.platform.OS === "ios") {
                    throw BluetoothError.BluetoothUnauthorized;
                }
                break;
            default:
                return;
        }
    }

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
