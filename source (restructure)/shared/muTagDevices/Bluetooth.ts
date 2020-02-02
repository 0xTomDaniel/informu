import { Observable } from "rxjs";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";

export interface ManufacturerData {
    bytes: ArrayBuffer;
    data: string;
    CDVType: string;
}

export interface Advertising {
    isConnectable: boolean;
    serviceUUIDs: Array<string>;
    manufacturerData: ManufacturerData;
    serviceData: object;
    txPowerLevel: number;
}

export type PeripheralId = string & { readonly _: unique symbol };

export interface Peripheral {
    id: PeripheralId;
    name: string;
    rssi: Rssi;
    advertising: Advertising;
}

export default interface Bluetooth {
    discoveredPeripheral: Observable<Peripheral>;
    start(): Promise<void>;
    startScan(serviceUUIDs: Array<string>, timeout: Millisecond): Promise<void>;
    stopScan(): Promise<void>;
    connect(peripheralId: PeripheralId): Promise<void>;
    disconnect(peripheralId: PeripheralId): Promise<void>;
    retrieveServices(peripheralId: PeripheralId): Promise<object>;
    read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T>;
    write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void>;
}
