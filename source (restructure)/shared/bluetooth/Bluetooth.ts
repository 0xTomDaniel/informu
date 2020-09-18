import { Rssi, Millisecond } from "../metaLanguage/Types";
import { Observable } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";

export enum ScanMode {
    opportunistic = -1,
    lowPower,
    balanced,
    lowLatency
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
    discoveredPeripheral: Observable<Peripheral>;

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
        timeout: Millisecond,
        scanMode?: ScanMode
    ): Promise<void>;
    stopScan(): Promise<void>;
    write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void>;
}
