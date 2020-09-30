import { Observable, ConnectableObservable } from "rxjs";
import Bluetooth, { ScanMode, PeripheralId, Peripheral } from "./Bluetooth";
import { Millisecond } from "../metaLanguage/Types";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import { publish } from "rxjs/operators";

export default class BluetoothAndroidDecorator implements Bluetooth {
    //
    // Public instance interface

    constructor(bluetooth: Bluetooth) {
        this.bluetooth = bluetooth;
    }

    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void> {
        const connectableObservable = this.bluetooth
            .connect(peripheralId, timeout)
            .pipe(publish()) as ConnectableObservable<void>;
        return connectableObservable;
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await this.bluetooth.disconnect(peripheralId);
    }

    async enableBluetooth(): Promise<void> {
        await this.bluetooth.enableBluetooth();
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
        return this.bluetooth.startScan(serviceUuids, timeout, scanMode);
    }

    async stopScan(): Promise<void> {
        await this.bluetooth.stopScan();
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

    private bluetooth: Bluetooth;

    // Public static interface

    // Protected static interface

    // Private static interface
}

const This = BluetoothAndroidDecorator;
