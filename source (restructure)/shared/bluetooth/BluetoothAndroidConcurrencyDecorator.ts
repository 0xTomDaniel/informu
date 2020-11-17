import {
    Observable,
    Subject,
    BehaviorSubject,
    concat,
    from,
    merge,
    timer,
    of,
    throwError
} from "rxjs";
import BluetoothPort, {
    ScanMode,
    PeripheralId,
    Peripheral,
    BluetoothError
} from "./BluetoothPort";
import { Millisecond } from "../metaLanguage/Types";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import {
    mergeAll,
    share,
    filter,
    take,
    finalize,
    ignoreElements,
    bufferToggle,
    windowToggle,
    mapTo,
    switchMap,
    startWith,
    map,
    tap,
    distinct,
    takeUntil,
    catchError
} from "rxjs/operators";
import { v4 as uuidV4 } from "uuid";

enum ScanState {
    Stopped,
    Stopping,
    Started,
    Starting,
    Paused,
    Pausing
}

export default class BluetoothAndroidConcurrencyDecorator
    implements BluetoothPort {
    //
    // Public instance interface

    constructor(bluetooth: BluetoothPort) {
        this.bluetooth = bluetooth;
        const onScanActive = this.scanState.pipe(
            filter(state => This.isScanActive(state)),
            distinct()
        );
        const onScanInactive = this.scanState.pipe(
            filter(state => !This.isScanActive(state)),
            distinct()
        );
        this.connectQueue = merge(
            this.pushToConnectQueue.pipe(
                tap(() =>
                    this.openConnectionCount.next(
                        this.openConnectionCount.value + 1
                    )
                ),
                bufferToggle(onScanActive, () => onScanInactive)
            ),
            this.pushToConnectQueue.pipe(
                windowToggle(onScanInactive, () => onScanActive)
            )
        ).pipe(mergeAll(), share());
    }

    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void> {
        const onConnect = new Promise<void>((resolve, reject) => {
            const connectTaskId = uuidV4();
            this.connectQueue
                .pipe(
                    filter(taskId => taskId === connectTaskId),
                    take(1)
                )
                .toPromise()
                .then(() => resolve())
                .catch(e => reject(e));
            this.pushToConnectQueue.next(connectTaskId);
        });
        return concat(
            from(onConnect).pipe(ignoreElements()),
            this.bluetooth
                .connect(peripheralId, timeout)
                .pipe(
                    finalize(() =>
                        this.openConnectionCount.next(
                            this.openConnectionCount.value - 1
                        )
                    )
                )
        );
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bluetooth.disconnect(peripheralId);
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T> {
        return this.bluetooth.read(peripheralId, characteristic);
    }

    startScan(
        serviceUuids: string[],
        timeout?: Millisecond,
        scanMode?: ScanMode
    ): Observable<Peripheral> {
        if (this.scanState.value !== ScanState.Stopped) {
            const error = BluetoothError.ScanAlreadyStarted;
            return throwError(error);
        }
        this.scanState.next(ScanState.Starting);
        if (timeout != null) {
            setTimeout(() => {
                this.stopScan();
            }, timeout);
        }
        const isReadyToPause = timer(This.minimumScanTime).pipe(
            mapTo(true),
            startWith(false)
        );
        const shouldPauseScan = isReadyToPause.pipe(
            switchMap(readyToPause => {
                return readyToPause
                    ? this.openConnectionCount.pipe(
                          map(connections => (connections > 0 ? true : false))
                      )
                    : of(false);
            }),
            distinct()
        );
        const onStartScan = this.openConnectionCount.pipe(
            filter(connections => connections === 0),
            mapTo<number, void>(undefined)
        );
        const onStopScan = this.scanState.pipe(
            filter(state => state === ScanState.Stopping),
            mapTo<number, void>(undefined)
        );
        const scanTask = shouldPauseScan.pipe(
            switchMap(shouldPause => {
                if (shouldPause) {
                    return from(this.pauseScan()).pipe(ignoreElements());
                } else {
                    this.scanState.next(ScanState.Started);
                    return this.bluetooth
                        .startScan(serviceUuids, timeout, scanMode)
                        .pipe(
                            catchError(error => {
                                this.scanState.next(ScanState.Stopped);
                                throw error;
                            })
                        );
                }
            })
        );
        return onStartScan.pipe(
            switchMap(() => scanTask),
            takeUntil(onStopScan)
        );
    }

    async stopScan(): Promise<void> {
        if (
            this.scanState.value === ScanState.Stopped ||
            this.scanState.value === ScanState.Stopping
        ) {
            return;
        }
        const onScanStopping = this.scanState
            .pipe(
                filter(state => state === ScanState.Stopping),
                mapTo<number, void>(undefined),
                take(1)
            )
            .toPromise();
        this.scanState.next(ScanState.Stopping);
        await onScanStopping;
        await this.bluetooth.stopScan();
        this.scanState.next(ScanState.Stopped);
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        await this.bluetooth.write(peripheralId, characteristic, value);
    }

    // Protected instance interface

    // Private instance interface

    private readonly bluetooth: BluetoothPort;
    private readonly connectQueue: Observable<string>;
    private readonly openConnectionCount = new BehaviorSubject<number>(0);
    private readonly pushToConnectQueue = new Subject<string>();
    private readonly scanState = new BehaviorSubject<ScanState>(
        ScanState.Stopped
    );

    private async pauseScan(): Promise<void> {
        this.scanState.next(ScanState.Pausing);
        await this.bluetooth.stopScan();
        this.scanState.next(ScanState.Paused);
    }

    // Public static interface

    // Protected static interface

    // Private static interface

    private static readonly minimumScanTime = 500 as Millisecond;

    private static isScanActive(state: ScanState): boolean {
        return (
            state === ScanState.Pausing ||
            state === ScanState.Started ||
            state === ScanState.Stopping
        );
    }
}

const This = BluetoothAndroidConcurrencyDecorator;
