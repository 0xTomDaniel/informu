import BluetoothPort, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "./BluetoothPort";
import BleManager from "react-native-ble-manager";
import {
    fromEvent,
    BehaviorSubject,
    Subject,
    merge,
    Subscription,
    NEVER,
    from,
    EMPTY
} from "rxjs";
import { NativeModules, NativeEventEmitter } from "react-native";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import { Buffer } from "buffer";
import { Millisecond } from "../metaLanguage/Types";
import {
    filter,
    scan,
    takeWhile,
    sample,
    tap,
    skipWhile,
    concatMap,
    switchMap,
    map,
    catchError,
    distinct,
    take
} from "rxjs/operators";

interface PeripheralConnection {
    peripheral: PeripheralId;
    status?: number;
}

enum ScanState {
    Started,
    Stopped,
    Paused
}

export default class ReactNativeBleManagerAdapter implements BluetoothPort {
    private readonly bleManagerEmitter = new NativeEventEmitter(
        NativeModules.BleManager
    );
    private bleManagerStarted = false;
    private handleScanEligibilitySubscription?: Subscription;
    private handleConnectQueueSubscription?: Subscription;
    private readonly peripheralConnected = new Subject<PeripheralId>();
    private readonly peripheralDisconnected = fromEvent<PeripheralConnection>(
        this.bleManagerEmitter,
        "BleManagerDisconnectPeripheral"
    );
    private readonly scanCache = new Set<PeripheralId>();
    private readonly scanState = new BehaviorSubject(ScanState.Stopped);
    private readonly bleManagerStopScan = fromEvent<undefined>(
        this.bleManagerEmitter,
        "BleManagerStopScan"
    );
    private readonly scanEligibleToPause = new BehaviorSubject(false);
    private readonly scanEligibleToStart = new BehaviorSubject(true);
    readonly discoveredPeripheral = this.scanState.pipe(
        // BleManagerDiscoverPeripheral emits peripherals even after scan has
        // been stopped.
        switchMap(state =>
            state === ScanState.Stopped
                ? NEVER
                : fromEvent<Peripheral>(
                      this.bleManagerEmitter,
                      "BleManagerDiscoverPeripheral"
                  )
        ),
        filter(peripheral => {
            if (this.scanCache.has(peripheral.id)) {
                return false;
            }
            this.scanCache.add(peripheral.id);
            return true;
        })
    );
    private readonly connectQueuePush = new Subject<PeripheralId>();
    private readonly connectQueuePop = new Subject<PeripheralId>();

    constructor() {
        this.handleScanEligibilitySubscription = this.handleScanEligibility();
        this.handleConnectQueueSubscription = this.handleConnectQueue();
    }

    destructor(): void {
        this.handleScanEligibilitySubscription?.unsubscribe();
        this.handleConnectQueueSubscription?.unsubscribe();
    }

    async start(): Promise<void> {
        await BleManager.start();
        this.bleManagerStarted = true;
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
        const androidOptions: BleManager.ScanOptions = {
            scanMode: scanMode,
            matchMode: 1, // MATCH_MODE_AGGRESSIVE
            numberOfMatches: 1 // MATCH_NUM_ONE_ADVERTISEMENT
        };
        this.handleScanResume(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            androidOptions
        );
        await this.startBleManagerScan(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            androidOptions
        );
        setTimeout(() => {
            this.scanEligibleToPause.next(true);
        }, 500);
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.stopScan().catch(e => reject(e));
            }, timeout);
            this.scanState
                .pipe(takeWhile(state => state !== ScanState.Stopped))
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
        return new Promise((resolve, reject) => {
            this.bleManagerStopScan
                .pipe(take(1))
                .subscribe(undefined, undefined, () => {
                    this.scanCache.clear();
                    this.scanState.next(ScanState.Stopped);
                });
            BleManager.stopScan().catch(e => reject(e));
        });
    }

    // Android React Native Bluetooth libraries cannot connect while scanning.
    //
    // Multiple connections at the same time really slow things down and cause a
    // lot of lag in general and the UI responsiveness.
    async connect(peripheralId: PeripheralId): Promise<void> {
        await this.pauseScan();
        return new Promise((resolve, reject) => {
            this.peripheralConnected
                .pipe(takeWhile(id => id !== peripheralId))
                .subscribe(
                    undefined,
                    e => reject(e),
                    () => resolve()
                );
            this.addToConnectQueue(peripheralId);
        });
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await BleManager.disconnect(peripheralId);
    }

    async retrieveServices(peripheralId: PeripheralId): Promise<void> {
        await BleManager.retrieveServices(peripheralId);
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        const characteristicData = await BleManager.read(
            peripheralId,
            characteristic.serviceUuid,
            characteristic.uuid
        );
        return characteristic.fromData(this.convertToBytes(characteristicData));
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        const data = [...characteristic.toData(value)];
        if (characteristic.withResponse) {
            await BleManager.write(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                data
            );
        } else {
            await BleManager.writeWithoutResponse(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                data
            );
        }
    }

    async enableBluetooth(): Promise<void> {
        await BleManager.enableBluetooth();
    }

    private convertToBytes(byteArray: number[]): Buffer | undefined {
        return byteArray.length === 0 ? undefined : Buffer.from(byteArray);
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
        androidOptions: BleManager.ScanOptions
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const handleState = (): void => {
                this.startBleManagerScan(
                    serviceUuids,
                    seconds,
                    iosAllowDuplicates,
                    androidOptions
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
        return new Promise((resolve, reject) => {
            if (this.scanState.value !== ScanState.Started) {
                resolve();
                return;
            }
            const handleCanPause = (): void => {
                BleManager.stopScan()
                    .then(() => {
                        this.scanState.next(ScanState.Paused);
                        resolve();
                    })
                    .catch(e => reject(e));
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
        androidOptions: BleManager.ScanOptions
    ): Promise<void> {
        await BleManager.scan(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            androidOptions
        ).then(() => this.scanState.next(ScanState.Started));
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
            this.connectQueuePush.pipe(
                map(peripheralId => ({ push: peripheralId }))
            ),
            this.connectQueuePop.pipe(
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

    private connectAndWaitUntilDisconnect(
        peripheralId: PeripheralId
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const subscription = this.peripheralDisconnected
                .pipe(
                    takeWhile(
                        connection => connection.peripheral !== peripheralId
                    )
                )
                .subscribe(undefined, undefined, () => resolve());
            BleManager.connect(peripheralId)
                .then(() => {
                    this.peripheralConnected.next(peripheralId);
                })
                .catch(e => {
                    subscription.unsubscribe();
                    reject(e);
                });
        });
    }

    private handleConnectQueue(): Subscription {
        return this.connectQueuePush
            .pipe(
                concatMap(peripheralId =>
                    from(this.connectAndWaitUntilDisconnect(peripheralId)).pipe(
                        catchError(e => {
                            console.warn(e);
                            return EMPTY;
                        }),
                        tap(undefined, undefined, () =>
                            this.connectQueuePop.next(peripheralId)
                        )
                    )
                )
            )
            .subscribe(undefined, e => console.error(e));
    }

    private addToConnectQueue(peripheralId: PeripheralId): void {
        this.connectQueuePush.next(peripheralId);
    }
}
