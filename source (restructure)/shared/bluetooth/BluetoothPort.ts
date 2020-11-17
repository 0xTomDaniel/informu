import { Rssi, Millisecond } from "../metaLanguage/Types";
import { Observable } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";

export enum BluetoothErrorType {
    BluetoothPoweredOff,
    BluetoothUnauthorized,
    ConnectionLostUnexpectedly,
    FailedToConnect,
    FailedToDisconnect,
    FailedToEnableBluetooth,
    FailedToRead,
    FailedToWrite,
    FailedToStartScan,
    FailedToStopScan,
    ScanAlreadyStarted
}

export class BluetoothError extends Error {
    originatingError: any;
    type: BluetoothErrorType;

    constructor(
        type: BluetoothErrorType,
        message: string,
        originatingError?: unknown
    ) {
        super(message);
        this.name = BluetoothErrorType[type];
        this.originatingError = originatingError;
        this.type = type;
    }

    static get BluetoothPoweredOff(): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.BluetoothPoweredOff,
            "Bluetooth is powered off."
        );
    }

    static get BluetoothUnauthorized(): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.BluetoothUnauthorized,
            "This application isn’t authorized to use the Bluetooth."
        );
    }

    static ConnectionLostUnexpectedly(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.ConnectionLostUnexpectedly,
            `Connection to Bluetooth device (${peripheralId}) lost unexpectedly.`,
            originatingError
        );
    }

    static FailedToConnect(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToConnect,
            `Failed to connect to Bluetooth device (${peripheralId}).`,
            originatingError
        );
    }

    static FailedToDisconnect(
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToDisconnect,
            `Failed to disconnect from Bluetooth device (${peripheralId}).`,
            originatingError
        );
    }

    static FailedToEnableBluetooth(originatingError?: unknown): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToEnableBluetooth,
            `Bluetooth is disabled, failed to enable.`,
            originatingError
        );
    }

    static FailedToRead(
        characteristic: string,
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToRead,
            `Failed to read characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            originatingError
        );
    }

    static FailedToWrite(
        value: string,
        characteristic: string,
        peripheralId: string,
        originatingError?: unknown
    ): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToWrite,
            `Failed to write (${value}) to characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            originatingError
        );
    }

    static FailedToStartScan(originatingError?: unknown): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToStartScan,
            "Failed to start Bluetooth device scanning.",
            originatingError
        );
    }

    static FailedToStopScan(originatingError?: unknown): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.FailedToStopScan,
            "Failed to stop Bluetooth device scanning.",
            originatingError
        );
    }

    static get ScanAlreadyStarted(): BluetoothError {
        return new BluetoothError(
            BluetoothErrorType.ScanAlreadyStarted,
            "Bluetooth device scanning has already started."
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

export interface Peripheral {
    readonly advertising: Advertising;
    readonly id: PeripheralId;
    readonly name: string;
    readonly rssi: Rssi | undefined;
}

export default interface BluetoothPort {
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
        value: T
    ): Promise<void>;
}
