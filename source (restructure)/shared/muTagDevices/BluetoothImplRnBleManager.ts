import Bluetooth, { Peripheral, PeripheralId } from "./Bluetooth";
import BleManager from "react-native-ble-manager";
import { fromEvent } from "rxjs";
import { NativeModules, NativeEventEmitter } from "react-native";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
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

    async start(): Promise<void> {
        await BleManager.start();
        this.bleManagerStarted = true;
    }

    async startScan(serviceUUIDs: string[], seconds: number): Promise<void> {
        await BleManager.scan(serviceUUIDs, seconds);
    }

    async stopScan(): Promise<void> {
        await BleManager.stopScan();
    }

    async connect(peripheralId: PeripheralId): Promise<void> {
        await BleManager.connect(peripheralId);
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        await BleManager.disconnect(peripheralId);
    }

    async retrieveServices(peripheralId: PeripheralId): Promise<object> {
        return await BleManager.retrieveServices(peripheralId);
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
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        if (characteristic.withResponse) {
            await BleManager.write(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                characteristic.toData(value)
            );
        } else {
            await BleManager.writeWithoutResponse(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                characteristic.toData(value)
            );
        }
    }
}
