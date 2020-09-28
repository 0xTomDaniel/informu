import { Observable } from "rxjs";
import { Peripheral, ScanMode, PeripheralId } from "./Bluetooth";
import { Millisecond } from "../metaLanguage/Types";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";

export default interface BluetoothPlatformFacade {
    discoveredPeripheral: Observable<Peripheral>;
    startScan(
        serviceUuids: Array<string>,
        timeout: Millisecond,
        scanMode?: ScanMode
    ): Promise<void>;
    stopScan(): Promise<void>;
    connect(peripheralId: PeripheralId): Observable<void>;
    disconnect(peripheralId: PeripheralId): Promise<void>;
    read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T>;
    write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T
    ): Promise<void>;
    enableBluetooth(): Promise<void>;
}
