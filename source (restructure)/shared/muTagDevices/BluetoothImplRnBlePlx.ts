import Bluetooth, { Peripheral, PeripheralId, ScanMode } from "./Bluetooth";
import {
    BehaviorSubject,
    Subject,
    merge,
    Subscription,
    EMPTY,
    Observable,
    defer,
    ConnectableObservable
} from "rxjs";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";
import { Millisecond, Rssi } from "../metaLanguage/Types";
import {
    filter,
    scan,
    takeWhile,
    sample,
    skipWhile,
    concatMap,
    map,
    catchError,
    distinct,
    publish
} from "rxjs/operators";
import {
    BleManager,
    ScanOptions,
    ScanMode as BleManagerScanMode,
    Device,
    fullUUID,
    State
} from "react-native-ble-plx";
import { Buffer } from "buffer";

interface PeripheralConnection {
    peripheral: PeripheralId;
    status?: number;
}

enum ScanState {
    Started,
    Stopped,
    Paused
}

export default class BluetoothImplRnBlePlx extends Bluetooth {
    private readonly bleManager = new BleManager();
    private handleScanEligibilitySubscription?: Subscription;
    private handleConnectQueueSubscription?: Subscription;
    private readonly scanCache = new Set<PeripheralId>();
    private readonly scanState = new BehaviorSubject(ScanState.Stopped);
    private readonly scanEligibleToPause = new BehaviorSubject(false);
    private readonly scanEligibleToStart = new BehaviorSubject(true);
    private readonly bleManagerDiscoveredDevice = new Subject<Device>();
    readonly discoveredPeripheral = this.bleManagerDiscoveredDevice.pipe(
        filter(device => {
            // "manufacturerData" of first returned peripheral record might be
            // null.
            //
            // https://github.com/Polidea/react-native-ble-plx/issues/605

            if (device.manufacturerData == null) {
                return false;
            }
            return true;
        }),
        map((device): Peripheral => this.getPeripheralFrom(device)),
        filter(peripheral => {
            if (this.scanCache.has(peripheral.id)) {
                return false;
            }
            this.scanCache.add(peripheral.id);
            return true;
        })
    );

    private readonly connectQueuePushed = new Subject<PeripheralId>();
    private readonly connectQueuePopped = new Subject<PeripheralId>();
    private readonly pushToConnectQueue = new Subject<
        ConnectableObservable<void>
    >();
    private readonly connectQueue = this.pushToConnectQueue.pipe(
        concatMap(connection =>
            defer(() => {
                connection.connect();
                return connection;
            }).pipe(
                catchError(e => {
                    console.warn(e);
                    return EMPTY;
                })
            )
        )
    );

    constructor() {
        super();
        this.handleScanEligibilitySubscription = this.handleScanEligibility();
        this.handleConnectQueueSubscription = this.handleConnectQueue();
    }

    destructor(): void {
        this.bleManager.destroy();
        this.handleScanEligibilitySubscription?.unsubscribe();
        this.handleConnectQueueSubscription?.unsubscribe();
    }

    async startScan(
        serviceUuids: string[],
        timeout: Millisecond,
        scanMode: ScanMode = ScanMode.balanced
    ): Promise<void> {
        if (this.scanState.value !== ScanState.Stopped) {
            throw Error("Scan already started.");
        }
        await this.scanReadyToStart();
        const seconds = timeout / 1000;
        const iosAllowDuplicates = false;
        const scanOptions: ScanOptions = {
            scanMode:
                BleManagerScanMode[
                    ScanMode[scanMode] as keyof typeof BleManagerScanMode
                ]
        };
        this.handleScanResume(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            scanOptions
        );
        await this.startBleManagerScan(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            scanOptions
        );
        setTimeout(() => {
            this.scanEligibleToPause.next(true);
        }, 500);
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.stopScan().catch(e => reject(e));
            }, timeout);
            this.scanState
                .pipe(
                    skipWhile(state => state === ScanState.Stopped),
                    takeWhile(state => state !== ScanState.Stopped)
                )
                .subscribe(undefined, undefined, () => {
                    clearTimeout(timeoutId);
                    resolve();
                });
        });
    }

    async stopScan(): Promise<void> {
        if (this.scanState.value === ScanState.Stopped) {
            return;
        }
        this.bleManager.stopDeviceScan();
        this.scanCache.clear();
        this.scanState.next(ScanState.Stopped);
    }

    // Android React Native Bluetooth libraries cannot connect while scanning.
    //
    // Multiple connections at the same time really slow things down and cause a
    // lot of lag in general and the UI responsiveness.
    connect(peripheralId: PeripheralId): Observable<void> {
        this.connectQueuePushed.next(peripheralId);
        const observable = new Observable<void>(subscriber => {
            const subscription = this.bleManager.onDeviceDisconnected(
                peripheralId,
                error => {
                    subscription.remove();
                    this.connectQueuePopped.next(peripheralId);
                    if (error != null) {
                        subscriber.error(error);
                    } else {
                        subscriber.complete();
                    }
                }
            );
            this.bleManager
                .connectToDevice(peripheralId)
                .then(() => subscriber.next())
                .catch(e => {
                    this.connectQueuePopped.next(peripheralId);
                    subscriber.error(e);
                });
        }).pipe(publish()) as ConnectableObservable<void>;
        this.pushToConnectQueue.next(observable);
        return observable;
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bleManager.cancelDeviceConnection(peripheralId);
    }

    async retrieveServices(peripheralId: PeripheralId): Promise<void> {
        await this.bleManager.discoverAllServicesAndCharacteristicsForDevice(
            peripheralId
        );
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        const deviceCharacteristic = await this.bleManager.readCharacteristicForDevice(
            peripheralId,
            fullUUID(characteristic.serviceUuid),
            fullUUID(characteristic.uuid)
        );
        const value =
            deviceCharacteristic.value == null ||
            deviceCharacteristic.value.length === 0
                ? undefined
                : deviceCharacteristic.value;
        return characteristic.fromBase64(value);
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T,
        transactionId?: string
    ): Promise<void> {
        const base64Value = characteristic.toBase64(value);
        if (characteristic.withResponse) {
            await this.bleManager.writeCharacteristicWithResponseForDevice(
                peripheralId,
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        } else {
            await this.bleManager.writeCharacteristicWithoutResponseForDevice(
                peripheralId,
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        }
    }

    async enableBluetooth(): Promise<void> {
        return new Promise((resolve, reject) => {
            let enabledAttempts = 0;
            const subscription = this.bleManager.onStateChange(state => {
                switch (state) {
                    case State.PoweredOn:
                        resolve();
                        subscription.remove();
                        return;
                    case State.PoweredOff:
                        if (enabledAttempts === 1) {
                            reject(Error("Failed to enable Bluetooth."));
                        }
                        enabledAttempts += 1;
                        this.bleManager.enable().catch(e => reject(e));
                        return;
                    case State.Unsupported:
                        reject(
                            Error(
                                "Your device does not support Bluetooth low energy."
                            )
                        );
                        subscription.remove();
                        return;
                    case State.Unauthorized:
                        reject(
                            Error(
                                "This app is currently not authorized to use Bluetooth low energy."
                            )
                        );
                        subscription.remove();
                        return;
                    case State.Resetting:
                    case State.Unknown:
                        return;
                }
            }, true);
        });
    }

    private async scanReadyToStart(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.scanEligibleToStart
                .pipe(takeWhile(canStart => !canStart))
                .subscribe(
                    undefined,
                    e => reject(e),
                    () => resolve()
                );
        });
    }

    private async handleScanResume(
        serviceUuids: string[],
        seconds: number,
        iosAllowDuplicates: boolean,
        options: ScanOptions
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const handleState = (): void => {
                this.startBleManagerScan(
                    serviceUuids,
                    seconds,
                    iosAllowDuplicates,
                    options
                ).catch(e => reject(e));
            };
            this.scanState
                .pipe(
                    skipWhile(state => state === ScanState.Stopped),
                    takeWhile(state => state !== ScanState.Stopped),
                    sample(this.scanEligibleToStart.pipe(filter(Boolean))),
                    filter(state => state === ScanState.Paused)
                )
                .subscribe(handleState, undefined, () => resolve());
        });
    }

    private async pauseScan(): Promise<void> {
        return new Promise(resolve => {
            if (this.scanState.value !== ScanState.Started) {
                resolve();
                return;
            }
            const handleCanPause = (): void => {
                this.bleManager.stopDeviceScan();
                this.scanState.next(ScanState.Paused);
                resolve();
            };
            this.scanEligibleToPause
                .pipe(takeWhile(canPause => !canPause))
                .subscribe(undefined, undefined, handleCanPause);
        });
    }

    private async startBleManagerScan(
        serviceUuids: string[],
        seconds: number,
        iosAllowDuplicates: boolean,
        options: ScanOptions
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.bleManager.startDeviceScan(
                serviceUuids,
                options,
                (error, device) => {
                    if (error != null) {
                        reject(error);
                        return;
                    }
                    if (device != null) {
                        this.bleManagerDiscoveredDevice.next(device);
                    }
                }
            );
            this.scanState.next(ScanState.Started);
            resolve();
        });
    }

    private handleScanEligibility(): Subscription {
        const handleQueueSizeChange = (queueSize: number): void => {
            if (queueSize === 0) {
                this.scanEligibleToStart.next(true);
            } else if (this.scanEligibleToStart.value) {
                this.scanEligibleToStart.next(false);
            }
        };
        const connectQueueUpdate = merge(
            this.connectQueuePushed.pipe(
                map(peripheralId => ({ push: peripheralId }))
            ),
            this.connectQueuePopped.pipe(
                map(peripheralId => ({ pop: peripheralId }))
            )
        ).pipe(
            scan((queue, queueUpdate) => {
                if ("push" in queueUpdate) {
                    queue.add(queueUpdate.push);
                } else if ("pop" in queueUpdate) {
                    queue.delete(queueUpdate.pop);
                }
                return queue;
            }, new Set<PeripheralId>()),
            distinct(queue => [...queue.values()])
        );
        return connectQueueUpdate
            .pipe(map(queue => queue.size))
            .subscribe(handleQueueSizeChange);
    }

    private handleConnectQueue(): Subscription {
        return this.connectQueue.subscribe(undefined, e => console.error(e));
    }

    private getPeripheralFrom(device: Device): Peripheral {
        // react-native-ble-manager includes 5 extra bytes at the beginning of
        // the manufacturing data compared to react-native-ble-plx. For
        // interface compatibility we must add a 5-byte padding.
        let manufacturerData = "";
        if (device.manufacturerData != null) {
            const bytes = Buffer.from(device.manufacturerData, "base64");
            const prependBytes = Buffer.alloc(5);
            const updatedBytes = Buffer.concat([prependBytes, bytes]);
            manufacturerData = updatedBytes.toString("base64");
        }
        return {
            id: device.id as PeripheralId,
            name: device.name ?? "",
            rssi: device.rssi != null ? (device.rssi as Rssi) : undefined,
            advertising: {
                isConnectable: device.isConnectable ?? undefined,
                serviceUuids: device.serviceUUIDs ?? [],
                manufacturerData: {
                    data: manufacturerData
                },
                serviceData: device.serviceData ?? {},
                txPowerLevel: device.txPowerLevel ?? undefined
            }
        };
    }
}
