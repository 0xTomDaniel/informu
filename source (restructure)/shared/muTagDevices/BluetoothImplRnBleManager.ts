import Bluetooth, { Peripheral, PeripheralId } from "./Bluetooth";
import BleManager from "react-native-ble-manager";
import { fromEvent } from "rxjs";
import { NativeModules, NativeEventEmitter } from "react-native";
import Characteristic, {
    ReadableCharacteristic
} from "./MuTagBLEGATT/Characteristic";

export default class BluetoothImplRnBleManager implements Bluetooth {
    private readonly bleManagerEmitter = new NativeEventEmitter(
        NativeModules.BleManager
    );
    private bleManagerStarted = false;

    readonly discoveredPeripheral = fromEvent<Peripheral>(
        this.bleManagerEmitter,
        "BleManagerDiscoverPeripheral"
    );

    constructor() {}

    async start(): Promise<void> {
        await BleManager.start();
        this.bleManagerStarted = true;
    }

    async startScan(serviceUUIDs: string[], seconds: number): Promise<void> {
        await this.start();
        await BleManager.scan([], 10);
    }

    async connect(peripheralId: PeripheralId): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        const characteristicData = await BleManager.read(
            peripheralId,
            characteristic.serviceUuid,
            characteristic.uuid
        );
        return characteristic.fromData(characteristicData || undefined);
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> &
            import("./MuTagBLEGATT/Characteristic").WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        throw new Error("Method not implemented.");

        if (characteristic.withResponse) {
            await device.writeCharacteristicWithResponseForService(
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        } else {
            await device.writeCharacteristicWithoutResponseForService(
                fullUUID(characteristic.serviceUuid),
                fullUUID(characteristic.uuid),
                base64Value,
                transactionId
            );
        }
    }
}
