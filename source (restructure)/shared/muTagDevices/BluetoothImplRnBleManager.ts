import Bluetooth, { Peripheral, PeripheralId, ScanMode } from "./Bluetooth";
import BleManager from "react-native-ble-manager";
import { fromEvent } from "rxjs";
import { NativeModules, NativeEventEmitter } from "react-native";
import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./MuTagBLEGATT/Characteristic";
import { Buffer } from "buffer";
import { Millisecond } from "../metaLanguage/Types";
import { filter } from "rxjs/operators";

export default class BluetoothImplRnBleManager implements Bluetooth {
    private readonly bleManagerEmitter = new NativeEventEmitter(
        NativeModules.BleManager
    );
    private bleManagerStarted = false;
    private readonly scanCache = new Set<PeripheralId>();
    private readonly scanStopped = fromEvent<undefined>(
        this.bleManagerEmitter,
        "BleManagerStopScan"
    );

    readonly discoveredPeripheral = fromEvent<Peripheral>(
        this.bleManagerEmitter,
        "BleManagerDiscoverPeripheral"
    ).pipe(
        filter(peripheral => {
            if (this.scanCache.has(peripheral.id)) {
                return false;
            }
            this.scanCache.add(peripheral.id);
            return true;
        })
    );

    async start(): Promise<void> {
        await BleManager.start();
        this.bleManagerStarted = true;
    }

    async startScan(
        serviceUuids: string[],
        timeout: Millisecond,
        scanMode: ScanMode = ScanMode.balanced
    ): Promise<void> {
        //debugger;
        const seconds = timeout / 1000;
        const iosAllowDuplicates = false;
        const androidOptions: BleManager.ScanOptions = {
            scanMode: scanMode,
            matchMode: 1, // MATCH_MODE_AGGRESSIVE
            numberOfMatches: 1 //MATCH_NUM_ONE_ADVERTISEMENT
        };
        await BleManager.scan(
            serviceUuids,
            seconds,
            iosAllowDuplicates,
            androidOptions
        );
        //await new Promise(resolve => setTimeout(() => resolve(), timeout));
        await new Promise(resolve => {
            const subscription = this.scanStopped.subscribe(() => {
                resolve();
                subscription.unsubscribe();
            });
        });
    }

    async stopScan(): Promise<void> {
        //debugger;
        await BleManager.stopScan().finally(() => this.scanCache.clear());
    }

    async connect(peripheralId: PeripheralId): Promise<void> {
        //debugger;
        await BleManager.connect(peripheralId);
    }

    async disconnect(peripheralId: PeripheralId): Promise<void> {
        //debugger;
        await BleManager.disconnect(peripheralId);
    }

    async retrieveServices(peripheralId: PeripheralId): Promise<object> {
        //debugger;
        return await BleManager.retrieveServices(peripheralId);
    }

    async read<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & ReadableCharacteristic<T>
    ): Promise<T> {
        //debugger;
        const characteristicData = await BleManager.read(
            peripheralId,
            characteristic.serviceUuid,
            characteristic.uuid
        );
        //DEBUG
        console.log("characteristicData: ", characteristicData);
        return characteristic.fromData(this.convertToBytes(characteristicData));
    }

    async write<T>(
        peripheralId: PeripheralId,
        characteristic: Characteristic<T> & WritableCharacteristic<T>,
        value: T
    ): Promise<void> {
        const data = [...characteristic.toData(value)];
        //debugger;
        if (characteristic.withResponse) {
            await BleManager.write(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                data
            );
        } else {
            await BleManager.writeWithoutResponse(
                peripheralId,
                characteristic.serviceUuid,
                characteristic.uuid,
                data
            );
        }
    }

    private convertToBytes(byteArray: number[]): Buffer | undefined {
        return byteArray.length === 0 ? undefined : Buffer.from(byteArray);
    }
}
