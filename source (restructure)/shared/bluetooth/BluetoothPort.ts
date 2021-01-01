import { Rssi, Millisecond } from "../metaLanguage/Types";
import { Observable } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import Exception from "../metaLanguage/Exception";

const ExceptionType = [
    "BluetoothPoweredOff",
    "BluetoothUnauthorized",
    "ConnectionLostUnexpectedly",
    "FailedToConnect",
    "FailedToDisconnect",
    "FailedToEnableBluetooth",
    "FailedToRead",
    "FailedToWrite",
    "FailedToStartScan",
    "FailedToStopScan",
    "ScanAlreadyStarted",
    "ScanTimeout"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class BluetoothException<T extends ExceptionType> extends Exception<T> {
    static get BluetoothPoweredOff(): BluetoothException<
        "BluetoothPoweredOff"
    > {
        return new this(
            "BluetoothPoweredOff",
            "Bluetooth is powered off.",
            "warn"
        );
    }

    static get BluetoothUnauthorized(): BluetoothException<
        "BluetoothUnauthorized"
    > {
        return new this(
            "BluetoothUnauthorized",
            "This application isn’t authorized to use the Bluetooth.",
            "warn"
        );
    }

    static ConnectionLostUnexpectedly(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothException<"ConnectionLostUnexpectedly"> {
        return new this(
            "ConnectionLostUnexpectedly",
            `Connection to Bluetooth device (${peripheralId}) lost unexpectedly.`,
            "warn",
            originatingError
        );
    }

    static FailedToConnect(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothException<"FailedToConnect"> {
        return new this(
            "FailedToConnect",
            `Failed to connect to Bluetooth device (${peripheralId}).`,
            "log",
            originatingError
        );
    }

    static FailedToDisconnect(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothException<"FailedToDisconnect"> {
        return new this(
            "FailedToDisconnect",
            `Failed to disconnect from Bluetooth device (${peripheralId}).`,
            "warn",
            originatingError
        );
    }

    static FailedToEnableBluetooth(
        originatingError?: unknown
    ): BluetoothException<"FailedToEnableBluetooth"> {
        return new this(
            "FailedToEnableBluetooth",
            `Bluetooth is disabled, failed to enable.`,
            "error",
            originatingError
        );
    }

    static FailedToRead(
        characteristic: string,
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothException<"FailedToRead"> {
        return new this(
            "FailedToRead",
            `Failed to read characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            "error",
            originatingError
        );
    }

    static FailedToWrite(
        value: string,
        characteristic: string,
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothException<"FailedToWrite"> {
        return new this(
            "FailedToWrite",
            `Failed to write (${value}) to characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            "error",
            originatingError
        );
    }

    static FailedToStartScan(
        originatingError?: unknown
    ): BluetoothException<"FailedToStartScan"> {
        return new this(
            "FailedToStartScan",
            "Failed to start Bluetooth device scanning.",
            "error",
            originatingError
        );
    }

    static FailedToStopScan(
        originatingError?: unknown
    ): BluetoothException<"FailedToStopScan"> {
        return new this(
            "FailedToStopScan",
            "Failed to stop Bluetooth device scanning.",
            "error",
            originatingError
        );
    }

    static get ScanAlreadyStarted(): BluetoothException<"ScanAlreadyStarted"> {
        return new this(
            "ScanAlreadyStarted",
            "Bluetooth device scanning has already started.",
            "warn"
        );
    }

    static get ScanTimeout(): BluetoothException<"ScanTimeout"> {
        return new this(
            "ScanTimeout",
            "Bluetooth device scanning has timed out.",
            "log"
        );
    }
}

export enum ScanMode {
    Opportunistic = -1,
    LowPower,
    Balanced,
    LowLatency
}

export interface Advertising {
    readonly isConnectable: boolean | undefined;
    readonly manufacturerData: Buffer;
    readonly serviceUuids: Array<string>;
    readonly serviceData: Record<string, unknown>;
    readonly txPowerLevel: number | undefined;
}

export type PeripheralId = string & { readonly _: unique symbol };

export type TaskId = string & { readonly _: unique symbol };

export interface Peripheral {
    readonly advertising: Advertising;
    readonly id: PeripheralId;
    readonly name: string;
    readonly rssi: Rssi | undefined;
}

export default interface BluetoothPort {
    cancelTask(taskId: TaskId): void;
    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void>;
    disconnect(peripheralId: PeripheralId): Promise<void>;
    read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T>;
    startScan(
        serviceUuids: Array<string>,
        timeout?: Millisecond,
        scanMode?: ScanMode
    ): Observable<Peripheral>;
    stopScan(): Promise<void>;
    write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T,
        taskId?: TaskId
    ): Promise<void>;
}
