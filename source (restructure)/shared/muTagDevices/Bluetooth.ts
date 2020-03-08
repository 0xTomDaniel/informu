import { Observable } from "rxjs";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";

export enum ScanMode {
    opportunistic = -1,
    lowPower,
    balanced,
    lowLatency
}

export interface ManufacturerData {
    bytes?: ArrayBuffer;
    data: string;
    cdvType?: string;
}

export interface Advertising {
    isConnectable: boolean | undefined;
    serviceUuids: Array<string>;
    manufacturerData: ManufacturerData;
    serviceData: object;
    txPowerLevel: number | undefined;
}

export type PeripheralId = string & { readonly _: unique symbol };

export interface Peripheral {
    id: PeripheralId;
    name: string;
    rssi: Rssi | undefined;
    advertising: Advertising;
}

export default abstract class Bluetooth {
    abstract discoveredPeripheral: Observable<Peripheral>;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected constructor() {}
    //abstract start(): Promise<void>;
    abstract startScan(
        serviceUuids: Array<string>,
        timeout: Millisecond,
        scanMode?: ScanMode
    ): Promise<void>;
    abstract stopScan(): Promise<void>;
    abstract connect(peripheralId: PeripheralId): Observable<void>;
    abstract disconnect(peripheralId: PeripheralId): Promise<void>;
    abstract retrieveServices(peripheralId: PeripheralId): Promise<void>;
    abstract read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T>;
    abstract write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void>;
    abstract enableBluetooth(): Promise<void>;
}
