import { Observable, throwError } from "rxjs";
import BluetoothPort, {
    ScanMode,
    PeripheralId,
    Peripheral,
    BluetoothError,
    BluetoothErrorType
} from "./BluetoothPort";
import { Millisecond } from "../metaLanguage/Types";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import { catchError } from "rxjs/operators";

export enum BluetoothAndroidDecoratorErrorType {
    OpenConnections,
    ScanInProgress
}

export class BluetoothAndroidDecoratorError extends Error {
    originatingError: any;
    type: BluetoothAndroidDecoratorErrorType;

    constructor(
        type: BluetoothAndroidDecoratorErrorType,
        message: string,
        originatingError?: unknown
    ) {
        super(message);
        this.name = BluetoothAndroidDecoratorErrorType[type];
        this.originatingError = originatingError;
        this.type = type;
    }

    static get OpenConnections(): BluetoothAndroidDecoratorError {
        return new BluetoothAndroidDecoratorError(
            BluetoothAndroidDecoratorErrorType.OpenConnections,
            "Cannot start Bluetooth device scanning because there are open connections."
        );
    }

    static get ScanInProgress(): BluetoothAndroidDecoratorError {
        return new BluetoothAndroidDecoratorError(
            BluetoothAndroidDecoratorErrorType.ScanInProgress,
            "Cannot connect to Bluetooth device because scan is in progress."
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

    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void> {
        if (this.sequentialTaskState === SequentialTaskState.Scan) {
            return throwError(BluetoothAndroidDecoratorError.ScanInProgress);
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
            return throwError(BluetoothAndroidDecoratorError.OpenConnections);
        }
        this.sequentialTaskState = SequentialTaskState.Scan;
        return this.bluetooth.startScan(serviceUuids, timeout, scanMode).pipe(
            catchError(e => {
                if (
                    e instanceof BluetoothError &&
                    e.type === BluetoothErrorType.ScanAlreadyStarted
                ) {
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
