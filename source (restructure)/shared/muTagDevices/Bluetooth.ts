/*export default abstract class Bluetooth {
    abstract discoveredPeripheral: Observable<Peripheral>;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected constructor() {}
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
}*/
