import BluetoothPort, {
    PeripheralId,
    Peripheral,
    ScanMode,
    BluetoothError
} from "./BluetoothPort";
import { Millisecond } from "../metaLanguage/Types";
import { Observable, Subject, Subscriber, throwError } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic,
    UTF8Characteristic
} from "./Characteristic";
import BluetoothAndroidDecorator, {
    BluetoothAndroidDecoratorError
} from "./BluetoothAndroidDecorator";
import { v4 as uuidV4 } from "uuid";
import { take } from "rxjs/operators";
import { Buffer } from "buffer";
import { fakeSchedulers } from "rxjs-marbles/jest";

const connectMock = jest.fn<
    Observable<void>,
    [PeripheralId, Millisecond | undefined]
>();
const disconnectMock = jest.fn<Promise<void>, [PeripheralId]>();
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
    (): BluetoothPort => ({
        connect: connectMock,
        disconnect: disconnectMock,
        read: readMock,
        startScan: startScanMock,
        stopScan: stopScanMock,
        write: writeMock
    })
);
const bluetoothMock = new BluetoothMock();
let bluetoothAndroidDecorator: BluetoothAndroidDecorator;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    bluetoothAndroidDecorator = new BluetoothAndroidDecorator(bluetoothMock);
});

const peripheralId = uuidV4() as PeripheralId;

// Decorated functionality

test("Fail to start Bluetooth scan while there are open connections.", async () => {
    expect.assertions(1);
    connectMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    bluetoothAndroidDecorator.connect(peripheralId);
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .toPromise();
    await expect(startScanPromise).rejects.toStrictEqual(
        BluetoothAndroidDecoratorError.OpenConnections
    );
});

test("Successfully start Bluetooth scan after all connections have completed.", async () => {
    expect.assertions(1);
    const connections = new Map<PeripheralId, Subscriber<void>>();
    const connectMockImplementation = (id: PeripheralId) =>
        new Observable<void>(subscriber => {
            connections.set(id, subscriber);
            subscriber.next();
        });
    connectMock.mockImplementationOnce(connectMockImplementation);
    connectMock.mockImplementationOnce(connectMockImplementation);
    const connectComplete01 = bluetoothAndroidDecorator
        .connect(peripheralId)
        .toPromise();
    const peripheralId02 = uuidV4() as PeripheralId;
    const connectComplete02 = bluetoothAndroidDecorator
        .connect(peripheralId02)
        .toPromise();
    const disconnectMockImplementation = (id: PeripheralId) =>
        new Promise<void>(resolve => {
            connections.get(id)?.complete();
            resolve();
        });
    disconnectMock.mockImplementationOnce(disconnectMockImplementation);
    disconnectMock.mockImplementationOnce(disconnectMockImplementation);
    bluetoothAndroidDecorator.disconnect(peripheralId);
    bluetoothAndroidDecorator.disconnect(peripheralId02);
    await connectComplete01;
    await connectComplete02;
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise).resolves.toBeUndefined();
});

test("Fail to connect to Bluetooth device while scanning.", async () => {
    expect.assertions(1);
    startScanMock.mockReturnValueOnce(new Observable());
    bluetoothAndroidDecorator.startScan([]);
    const connectPromise = bluetoothAndroidDecorator
        .connect(peripheralId)
        .toPromise();
    await expect(connectPromise).rejects.toStrictEqual(
        BluetoothAndroidDecoratorError.ScanInProgress
    );
});

test("Successfully connect to Bluetooth device after scanning has completed.", async () => {
    expect.assertions(1);
    const startScanSubject = new Subject<void>();
    let scanSubscriber: Subscriber<Peripheral> | undefined;
    startScanMock.mockImplementationOnce(
        () =>
            new Observable(subscriber => {
                scanSubscriber = subscriber;
                startScanSubject.next();
            })
    );
    stopScanMock.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                scanSubscriber?.complete();
                resolve();
            })
    );
    const onScanStarted = startScanSubject.pipe(take(1)).toPromise();
    const startScanComplete = bluetoothAndroidDecorator
        .startScan([])
        .toPromise();
    await onScanStarted;
    await bluetoothAndroidDecorator.stopScan();
    await startScanComplete;
    connectMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const onConnect = bluetoothAndroidDecorator
        .connect(peripheralId)
        .pipe(take(1))
        .toPromise();
    await expect(onConnect).resolves.toBeUndefined();
});

// Default functionality

const serviceUuids: string[] = [uuidV4(), uuidV4()];

test("Successfully start Bluetooth scan.", async () => {
    expect.assertions(3);
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
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

test(
    "Successfully stop Bluetooth scan after timeout.",
    fakeSchedulers(async advance => {
        expect.assertions(3);
        jest.useFakeTimers("modern");
        startScanMock.mockImplementationOnce(
            (uuids, scanTimeout) =>
                new Observable(subscriber => {
                    const timeout = scanTimeout ?? 10000;
                    const timeoutId = setTimeout(
                        () => subscriber.complete(),
                        timeout
                    );
                    advance(timeout);
                    const teardown = () => clearTimeout(timeoutId);
                    return teardown;
                })
        );
        const timeout = 5000 as Millisecond;
        const startScanPromise = bluetoothAndroidDecorator
            .startScan(serviceUuids, timeout)
            .toPromise();
        await expect(startScanPromise).resolves.toBeUndefined();
        expect(startScanMock).toBeCalledTimes(1);
        expect(startScanMock).toBeCalledWith(serviceUuids, timeout, undefined);
    })
);

test("Fail to start Bluetooth scan again before first completes.", async () => {
    expect.assertions(2);
    let didScanStart = false;
    const error = BluetoothError.ScanAlreadyStarted;
    const startScanImplementation = () => {
        if (didScanStart) {
            return throwError(error);
        } else {
            didScanStart = true;
            return new Observable<Peripheral>(subscriber => subscriber.next());
        }
    };
    startScanMock.mockImplementationOnce(startScanImplementation);
    startScanMock.mockImplementationOnce(startScanImplementation);
    const startScanPromise01 = bluetoothAndroidDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    const startScanPromise02 = bluetoothAndroidDecorator
        .startScan([])
        .toPromise();
    await expect(startScanPromise02).rejects.toStrictEqual(error);
    bluetoothAndroidDecorator.stopScan();
    await expect(startScanPromise01).resolves.toBeUndefined();
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
    await expect(startScanPromise).rejects.toStrictEqual(error);
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
    expect.assertions(3);
    const startScanSubject = new Subject<void>();
    let scanSubscriber: Subscriber<Peripheral> | undefined;
    startScanMock.mockImplementationOnce(
        () =>
            new Observable(subscriber => {
                scanSubscriber = subscriber;
                startScanSubject.next();
            })
    );
    stopScanMock.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                scanSubscriber?.complete();
                resolve();
            })
    );
    const onScanStarted = startScanSubject.pipe(take(1)).toPromise();
    const startScanComplete = bluetoothAndroidDecorator
        .startScan([])
        .toPromise();
    await onScanStarted;
    await expect(bluetoothAndroidDecorator.stopScan()).resolves.toBeUndefined();
    await expect(startScanComplete).resolves.toBeUndefined();
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Successfully stop Bluetooth scan after unsubscribing from startScan.", async () => {
    expect.assertions(4);
    startScanMock.mockImplementationOnce(
        () => new Observable(subscriber => subscriber.next())
    );
    startScanMock.mockImplementationOnce(
        () => new Observable(subscriber => subscriber.next())
    );
    stopScanMock.mockImplementationOnce(() => Promise.resolve());
    const onScanStarted01 = bluetoothAndroidDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    await expect(onScanStarted01).resolves.toBeUndefined();
    await expect(bluetoothAndroidDecorator.stopScan()).resolves.toBeUndefined();
    // Verifies that scan state was "Stopped", otherwise an error would be
    // thrown.
    const onScanStarted02 = bluetoothAndroidDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    await expect(onScanStarted02).resolves.toBeUndefined();
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Fail to stop Bluetooth scan.", async () => {
    expect.assertions(2);
    startScanMock.mockReturnValueOnce(new Observable());
    const startSubscription = bluetoothAndroidDecorator
        .startScan([])
        .subscribe();
    const error = BluetoothError.FailedToStopScan;
    stopScanMock.mockRejectedValueOnce(error);
    await expect(bluetoothAndroidDecorator.stopScan()).rejects.toStrictEqual(
        error
    );
    startSubscription.unsubscribe();
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
    await expect(connectPromise).rejects.toStrictEqual(error);
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
    ).rejects.toStrictEqual(error);
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
    ).rejects.toStrictEqual(error);
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
    ).rejects.toStrictEqual(error);
    expect(writeMock).toBeCalledTimes(1);
    expect(writeMock).toBeCalledWith(peripheralId, characteristic, writeValue);
});
