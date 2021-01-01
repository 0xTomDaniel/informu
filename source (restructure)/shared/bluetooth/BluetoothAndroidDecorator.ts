import { Observable, throwError } from "rxjs";
import BluetoothPort, {
    ScanMode,
    PeripheralId,
    Peripheral,
    BluetoothException,
    TaskId
} from "./BluetoothPort";
import { Millisecond } from "../metaLanguage/Types";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import { catchError } from "rxjs/operators";
import Exception from "../metaLanguage/Exception";

const ExceptionType = ["OpenConnections", "ScanInProgress"] as const;
export type ExceptionType = typeof ExceptionType[number];

export class BluetoothAndroidDecoratorException<
    T extends ExceptionType
> extends Exception<T> {
    static get OpenConnections(): BluetoothAndroidDecoratorException<
        "OpenConnections"
    > {
        return new this(
            "OpenConnections",
            "Cannot start Bluetooth device scanning because there are open connections.",
            "error",
            undefined,
            true
        );
    }

    static get ScanInProgress(): BluetoothAndroidDecoratorException<
        "ScanInProgress"
    > {
        return new this(
            "ScanInProgress",
            "Cannot connect to Bluetooth device because scan is in progress.",
            "error",
            undefined,
            true
        );
    }
}

enum SequentialTaskState {
    Connect,
    Idle,
    Scan
}

export default class BluetoothAndroidDecorator implements BluetoothPort {
    //
    // Public instance interface

    constructor(bluetooth: BluetoothPort) {
        this.bluetooth = bluetooth;
    }

    cancelTask(taskId: TaskId): void {
        this.bluetooth.cancelTask(taskId);
    }

    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void> {
        if (this.sequentialTaskState === SequentialTaskState.Scan) {
            return throwError(
                BluetoothAndroidDecoratorException.ScanInProgress
            );
        }
        this.openConnections.add(peripheralId);
        if (this.sequentialTaskState !== SequentialTaskState.Connect) {
            this.sequentialTaskState = SequentialTaskState.Connect;
        }
        return this.bluetooth.connect(peripheralId, timeout).pipe(
            catchError(e => {
                this.removeConnection(peripheralId);
                throw e;
            })
        );
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bluetooth.disconnect(peripheralId);
        this.removeConnection(peripheralId);
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
        if (this.sequentialTaskState === SequentialTaskState.Connect) {
            return throwError(
                BluetoothAndroidDecoratorException.OpenConnections
            );
        }
        this.sequentialTaskState = SequentialTaskState.Scan;
        return this.bluetooth.startScan(serviceUuids, timeout, scanMode).pipe(
            catchError(e => {
                if (BluetoothException.isType(e, "ScanAlreadyStarted")) {
                    throw e;
                }
                this.sequentialTaskState = SequentialTaskState.Idle;
                throw e;
            })
        );
    }

    async stopScan(): Promise<void> {
        await this.bluetooth.stopScan();
        this.sequentialTaskState = SequentialTaskState.Idle;
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

    private readonly openConnections = new Set<PeripheralId>();
    private readonly bluetooth: BluetoothPort;
    private sequentialTaskState = SequentialTaskState.Idle;

    private removeConnection(peripheralId: PeripheralId): void {
        this.openConnections.delete(peripheralId);
        if (this.openConnections.size === 0) {
            this.sequentialTaskState = SequentialTaskState.Idle;
        }
    }

    // Public static interface

    // Protected static interface

    // Private static interface
}

//const This = BluetoothAndroidDecorator;
