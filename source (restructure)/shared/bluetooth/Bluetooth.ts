import { Rssi, Millisecond } from "../metaLanguage/Types";
import { Observable } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";

export enum BluetoothErrorType {
    ScanAlreadyStarted
}

const getBluetoothErrorMessage = (type: BluetoothErrorType): string => {
    switch (type) {
        case BluetoothErrorType.ScanAlreadyStarted:
            return "Bluetooth device scanning was already started.";
    }
};

export class BluetoothError extends Error {
    type: BluetoothErrorType;

    constructor(type: BluetoothErrorType) {
        super(getBluetoothErrorMessage(type));
        this.name = BluetoothErrorType[type];
        this.type = type;
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

export default interface Bluetooth {
    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void>;
    disconnect(peripheralId: PeripheralId): Promise<void>;
    enableBluetooth(): Promise<void>;
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
