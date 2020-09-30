import Bluetooth, { PeripheralId, Peripheral, ScanMode } from "./Bluetooth";
import { Millisecond } from "../metaLanguage/Types";
import { Observable, Subject } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic,
    UTF8Characteristic
} from "./Characteristic";
import BluetoothAndroidDecorator from "./BluetoothAndroidDecorator";
import { v4 as uuidV4 } from "uuid";
import { take } from "rxjs/operators";
import { Buffer } from "buffer";

const connectMock = jest.fn<
    Observable<void>,
    [PeripheralId, Millisecond | undefined]
>();
const disconnectMock = jest.fn<Promise<void>, [PeripheralId]>();
const enableBluetoothMock = jest.fn<Promise<void>, []>();
const readMock = jest.fn<
    Promise<any>,
    [PeripheralId, ReadableCharacteristic<any>]
>();
const startScanMock = jest.fn<
    Observable<Peripheral>,
    [Array<string>, Millisecond | undefined, ScanMode | undefined]
>();
const stopScanMock = jest.fn<Promise<void>, []>();
const writeMock = jest.fn<
    Promise<void>,
    [PeripheralId, WritableCharacteristic<any>, any]
>();
const BluetoothMock = jest.fn(
    (): Bluetooth => ({
        connect: connectMock,
        disconnect: disconnectMock,
        enableBluetooth: enableBluetoothMock,
        read: readMock,
        startScan: startScanMock,
        stopScan: stopScanMock,
        write: writeMock
    })
);
const bluetoothMock = new BluetoothMock();
const bluetoothAndroidDecorator = new BluetoothAndroidDecorator(bluetoothMock);

beforeEach(() => {
    jest.clearAllMocks();
});

const peripheralId = uuidV4() as PeripheralId;

// Decorated functionality

test("Queue connect requests while scan is running then execute all connect requests after scan is stopped.", async () => {
    expect.assertions(2);
    const startScanMockSubject = new Subject<Peripheral>();
    startScanMock.mockReturnValueOnce(startScanMockSubject.asObservable());
    bluetoothAndroidDecorator.startScan([]).subscribe();
    connectMock.mockReturnValue(
        new Observable<void>(subscriber => {
            subscriber.next();
            subscriber.complete();
        })
    );
    let isSubscription01Connected = false;
    const connectSubscription01 = bluetoothAndroidDecorator
        .connect(peripheralId)
        .subscribe(() => {
            isSubscription01Connected = true;
        });
    let isSubscription02Connected = false;
    const connectSubscription02 = bluetoothAndroidDecorator
        .connect(peripheralId)
        .subscribe(() => {
            isSubscription02Connected = true;
        });
    let isSubscription03Connected = false;
    const connectSubscription03 = bluetoothAndroidDecorator
        .connect(peripheralId)
        .subscribe(() => {
            isSubscription03Connected = true;
        });
    expect(connectSubscription01.closed).toBeFalsy();
    expect(isSubscription01Connected).toBeFalsy();
    expect(connectSubscription02.closed).toBeFalsy();
    expect(isSubscription02Connected).toBeFalsy();
    expect(connectSubscription03.closed).toBeFalsy();
    expect(isSubscription03Connected).toBeFalsy();
    startScanMockSubject.complete();
    expect(connectSubscription01.closed).toBeTruthy();
    expect(isSubscription01Connected).toBeTruthy();
    expect(connectSubscription02.closed).toBeTruthy();
    expect(isSubscription02Connected).toBeTruthy();
    expect(connectSubscription03.closed).toBeTruthy();
    expect(isSubscription03Connected).toBeTruthy();
});

// Default functionality

test("Successfully enable Bluetooth.", async () => {
    expect.assertions(2);
    await expect(
        bluetoothAndroidDecorator.enableBluetooth()
    ).resolves.toBeUndefined();
    expect(enableBluetoothMock).toBeCalledTimes(1);
});

test("Fail to enable Bluetooth.", async () => {
    expect.assertions(2);
    const error = Error("Failed to enable Bluetooth.");
    enableBluetoothMock.mockRejectedValueOnce(error);
    await expect(bluetoothAndroidDecorator.enableBluetooth()).rejects.toThrow(
        error
    );
    expect(enableBluetoothMock).toBeCalledTimes(1);
});

const serviceUuids: string[] = [uuidV4(), uuidV4()];

test("Successfully start Bluetooth scan.", async () => {
    expect.assertions(3);
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.complete())
    );
    const timeout = 10000 as Millisecond;
    const scanMode: ScanMode = ScanMode.Opportunistic;
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids, timeout, scanMode)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise).resolves.toBeUndefined();
    expect(startScanMock).toBeCalledTimes(1);
    expect(startScanMock).toBeCalledWith(serviceUuids, timeout, scanMode);
});

test("Fail to start Bluetooth scan.", async () => {
    expect.assertions(3);
    const error = Error("Failed to start Bluetooth scan.");
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.error(error))
    );
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise).rejects.toThrow(error);
    expect(startScanMock).toBeCalledTimes(1);
    expect(startScanMock).toBeCalledWith(serviceUuids, undefined, undefined);
});

test("Successfully receive detected device.", async () => {
    expect.assertions(3);
    const foundPeripheral: Peripheral = {
        advertising: {
            isConnectable: undefined,
            manufacturerData: Buffer.alloc(0),
            serviceData: {},
            serviceUuids: [],
            txPowerLevel: undefined
        },
        id: uuidV4() as PeripheralId,
        name: "",
        rssi: undefined
    };
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next(foundPeripheral))
    );
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise).resolves.toBe(foundPeripheral);
    expect(startScanMock).toBeCalledTimes(1);
    expect(startScanMock).toBeCalledWith(serviceUuids, undefined, undefined);
});

test("Successfully stop Bluetooth scan.", async () => {
    expect.assertions(2);
    stopScanMock.mockResolvedValueOnce(undefined);
    await expect(bluetoothAndroidDecorator.stopScan()).resolves.toBeUndefined();
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Fail to stop Bluetooth scan.", async () => {
    expect.assertions(2);
    const error = Error("Failed to stop Bluetooth scan.");
    stopScanMock.mockRejectedValueOnce(error);
    await expect(bluetoothAndroidDecorator.stopScan()).rejects.toThrow(error);
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Successfully connect to Bluetooth device.", async () => {
    expect.assertions(3);
    connectMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const timeout = 15000 as Millisecond;
    const connectPromise = bluetoothAndroidDecorator
        .connect(peripheralId, timeout)
        .pipe(take(1))
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
    expect(connectMock).toBeCalledTimes(1);
    expect(connectMock).toBeCalledWith(peripheralId, timeout);
});

test("Fail to connect to Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to connect to Bluetooth device.");
    connectMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.error(error))
    );
    const connectPromise = bluetoothAndroidDecorator
        .connect(peripheralId)
        .pipe(take(1))
        .toPromise();
    await expect(connectPromise).rejects.toThrow(error);
    expect(connectMock).toBeCalledTimes(1);
    expect(connectMock).toBeCalledWith(peripheralId, undefined);
});

test("Successfully disconnect from Bluetooth device.", async () => {
    expect.assertions(3);
    disconnectMock.mockResolvedValueOnce(undefined);
    await expect(
        bluetoothAndroidDecorator.disconnect(peripheralId)
    ).resolves.toBeUndefined();
    expect(disconnectMock).toBeCalledTimes(1);
    expect(disconnectMock).toBeCalledWith(peripheralId);
});

test("Fail to disconnect from Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to disconnect from Bluetooth device.");
    disconnectMock.mockRejectedValueOnce(error);
    await expect(
        bluetoothAndroidDecorator.disconnect(peripheralId)
    ).rejects.toThrow(error);
    expect(disconnectMock).toBeCalledTimes(1);
    expect(disconnectMock).toBeCalledWith(peripheralId);
});

class ManufacturerName extends UTF8Characteristic
    implements ReadableCharacteristic<string>, WritableCharacteristic<string> {
    readonly byteLength = 11;
    readonly serviceUuid = "0000180A-0000-1000-8000-00805F9B34FB";
    readonly uuid = "00002A29-0000-1000-8000-00805F9B34FB";
    readonly withResponse = false;
}

test("Successfully read string from Bluetooth device.", async () => {
    expect.assertions(3);
    const readValue = "informu";
    readMock.mockResolvedValueOnce(readValue);
    const characteristic = new ManufacturerName();
    await expect(
        bluetoothAndroidDecorator.read(peripheralId, characteristic)
    ).resolves.toBe(readValue);
    expect(readMock).toBeCalledTimes(1);
    expect(readMock).toBeCalledWith(peripheralId, characteristic);
});

test("Fail to read string from Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to read string from Bluetooth device.");
    readMock.mockRejectedValueOnce(error);
    const characteristic = new ManufacturerName();
    await expect(
        bluetoothAndroidDecorator.read(peripheralId, characteristic)
    ).rejects.toThrow(error);
    expect(readMock).toBeCalledTimes(1);
    expect(readMock).toBeCalledWith(peripheralId, characteristic);
});

test("Successfully write string to Bluetooth device.", async () => {
    expect.assertions(3);
    writeMock.mockResolvedValueOnce(undefined);
    const characteristic = new ManufacturerName();
    const writeValue = "informu";
    await expect(
        bluetoothAndroidDecorator.write(
            peripheralId,
            characteristic,
            writeValue
        )
    ).resolves.toBeUndefined();
    expect(writeMock).toBeCalledTimes(1);
    expect(writeMock).toBeCalledWith(peripheralId, characteristic, writeValue);
});

test("Fails to write string to Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to write string to Bluetooth device.");
    writeMock.mockRejectedValueOnce(error);
    const characteristic = new ManufacturerName();
    const writeValue = "informu";
    await expect(
        bluetoothAndroidDecorator.write(
            peripheralId,
            characteristic,
            writeValue
        )
    ).rejects.toThrow(error);
    expect(writeMock).toBeCalledTimes(1);
    expect(writeMock).toBeCalledWith(peripheralId, characteristic, writeValue);
});
