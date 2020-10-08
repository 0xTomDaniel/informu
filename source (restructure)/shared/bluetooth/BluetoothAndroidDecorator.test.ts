import Bluetooth, {
    PeripheralId,
    Peripheral,
    ScanMode,
    BluetoothError
} from "./Bluetooth";
import { Millisecond } from "../metaLanguage/Types";
import { Observable, Subject, BehaviorSubject, Subscriber } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic,
    UTF8Characteristic
} from "./Characteristic";
import BluetoothAndroidDecorator from "./BluetoothAndroidDecorator";
import { v4 as uuidV4 } from "uuid";
import { take, filter } from "rxjs/operators";
import { Buffer } from "buffer";
import { fakeSchedulers } from "rxjs-marbles/jest";

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
let bluetoothAndroidDecorator: BluetoothAndroidDecorator;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    bluetoothAndroidDecorator = new BluetoothAndroidDecorator(bluetoothMock);
});

const peripheralId = uuidV4() as PeripheralId;

// Decorated functionality

test("Queue connect requests while scan is running then execute all connect requests after scan is stopped.", async () => {
    expect.assertions(1);
    startScanMock.mockImplementationOnce(() => {
        return new Observable();
    });
    stopScanMock.mockImplementationOnce(() => {
        return Promise.resolve();
    });
    const executionOrder: number[] = [];
    const onStartScanComplete = bluetoothAndroidDecorator
        .startScan([])
        .toPromise()
        .then(() => executionOrder.push(1));
    connectMock.mockReturnValue(
        new Observable<void>(subscriber => {
            subscriber.next();
            subscriber.complete();
        })
    );
    const connectionEstablishedSubject01 = new Subject<void>();
    const connectionCompleteSubject01 = new Subject<void>();
    bluetoothAndroidDecorator.connect(peripheralId).subscribe(
        () => {
            connectionEstablishedSubject01.next();
        },
        undefined,
        () => {
            connectionCompleteSubject01.next();
        }
    );
    const connectionEstablishedSubject02 = new Subject<void>();
    const connectionCompleteSubject02 = new Subject<void>();
    bluetoothAndroidDecorator.connect(peripheralId).subscribe(
        () => {
            connectionEstablishedSubject02.next();
        },
        undefined,
        () => {
            connectionCompleteSubject02.next();
        }
    );
    const connectionEstablishedSubject03 = new Subject<void>();
    const connectionCompleteSubject03 = new Subject<void>();
    bluetoothAndroidDecorator.connect(peripheralId).subscribe(
        () => {
            connectionEstablishedSubject03.next();
        },
        undefined,
        () => {
            connectionCompleteSubject03.next();
        }
    );
    const onConnectionEstablished01 = connectionEstablishedSubject01
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(2));
    const onConnectionComplete01 = connectionCompleteSubject01
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(3));
    const onConnectionEstablished02 = connectionEstablishedSubject02
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(4));
    const onConnectionComplete02 = connectionCompleteSubject02
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(5));
    const onConnectionEstablished03 = connectionEstablishedSubject03
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(6));
    const onConnectionComplete03 = connectionCompleteSubject03
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(7));
    await new Promise(setImmediate);
    await bluetoothAndroidDecorator.stopScan();
    await Promise.all([
        onStartScanComplete,
        onConnectionEstablished01,
        onConnectionComplete01,
        onConnectionEstablished02,
        onConnectionComplete02,
        onConnectionEstablished03,
        onConnectionComplete03
    ]);
    expect(executionOrder).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
});

test(
    "Run scan for a minimum of 500ms since starting and then pause (stop) scan when at least one connect request is received.",
    fakeSchedulers(async advance => {
        expect.assertions(4);
        jest.useFakeTimers("modern");
        const scanStoppedSubject = new BehaviorSubject<boolean>(false);
        let startScanSubscriber: Subscriber<Peripheral> | undefined;
        startScanMock.mockReturnValueOnce(
            new Observable(subscriber => {
                startScanSubscriber = subscriber;
                const teardown = () => scanStoppedSubject.next(true);
                return teardown;
            })
        );
        stopScanMock.mockImplementationOnce(() => {
            startScanSubscriber?.complete();
            return Promise.resolve();
        });
        const executionOrder: number[] = [];
        let didScanComplete = false;
        const startScanSubscription = bluetoothAndroidDecorator
            .startScan([])
            .subscribe(undefined, undefined, () => (didScanComplete = true));
        connectMock.mockReturnValue(
            new Observable<void>(subscriber => {
                subscriber.next();
                subscriber.complete();
            })
        );
        const connectionEstablishedSubject01 = new Subject<void>();
        const connectionCompleteSubject01 = new Subject<void>();
        bluetoothAndroidDecorator.connect(peripheralId).subscribe(
            () => {
                connectionEstablishedSubject01.next();
            },
            undefined,
            () => {
                connectionCompleteSubject01.next();
            }
        );
        const onScanPaused = scanStoppedSubject
            .pipe(
                filter(isStopped => isStopped),
                take(1)
            )
            .toPromise()
            .then(() => executionOrder.push(1));
        const onConnectionEstablished01 = connectionEstablishedSubject01
            .pipe(take(1))
            .toPromise()
            .then(() => executionOrder.push(2));
        const onConnectionComplete01 = connectionCompleteSubject01
            .pipe(take(1))
            .toPromise()
            .then(() => executionOrder.push(3));
        advance(499);
        expect(scanStoppedSubject.value).toBeFalsy();
        advance(1);
        expect(scanStoppedSubject.value).toBeTruthy();
        await Promise.all([
            onScanPaused,
            onConnectionEstablished01,
            onConnectionComplete01
        ]);
        expect(executionOrder).toStrictEqual([1, 2, 3]);
        expect(didScanComplete).toBeFalsy();
        startScanSubscription.unsubscribe();
    })
);

test("Queue scan request while connection is open then start scanning after connection has closed.", async () => {
    expect.assertions(1);
    const connectionEstablishedSubject01 = new Subject<void>();
    const connectionCompleteSubject01 = new Subject<void>();
    bluetoothAndroidDecorator.connect(peripheralId).subscribe(
        () => {
            connectionEstablishedSubject01.next();
        },
        undefined,
        () => {
            connectionCompleteSubject01.next();
        }
    );
    const executionOrder: number[] = [];
    const onConnectionEstablished01 = connectionEstablishedSubject01
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(1));
    const onConnectionComplete01 = connectionCompleteSubject01
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(2));
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => {
            subscriber.next();
        })
    );
    const onScanStarted = bluetoothAndroidDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise()
        .then(() => executionOrder.push(3));
    connectMock.mockReturnValue(
        new Observable<void>(subscriber => {
            subscriber.next();
            subscriber.complete();
        })
    );
    await Promise.all([
        onConnectionEstablished01,
        onConnectionComplete01,
        onScanStarted
    ]);
    expect(executionOrder).toStrictEqual([1, 2, 3]);
});

test("New connection executes after startScan throws.", async () => {
    expect.assertions(2);
    const error = Error("Failed to start Bluetooth scan.");
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.error(error))
    );
    const startScanPromise = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .toPromise();
    await expect(startScanPromise).rejects.toThrow(error);
    connectMock.mockReturnValue(
        new Observable<void>(subscriber => {
            subscriber.next();
            subscriber.complete();
        })
    );
    const connectPromise = bluetoothAndroidDecorator
        .connect(peripheralId)
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
});

test("StartScan successfully starts after startScan has previously thrown.", async () => {
    expect.assertions(2);
    const error = Error("Failed to start Bluetooth scan.");
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.error(error))
    );
    const startScanPromise01 = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .toPromise();
    await expect(startScanPromise01).rejects.toThrow(error);
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const startScanPromise02 = bluetoothAndroidDecorator
        .startScan(serviceUuids)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise02).resolves.toBeUndefined();
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

test("Fail to start Bluetooth scan again before first completes.", async () => {
    expect.assertions(2);
    startScanMock.mockReturnValue(
        new Observable(subscriber => subscriber.next())
    );
    const startScanPromise01 = bluetoothAndroidDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    const startScanPromise02 = bluetoothAndroidDecorator
        .startScan([])
        .toPromise();
    const error = BluetoothError.ScanAlreadyStarted;
    await expect(startScanPromise02).rejects.toThrow(error);
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
    expect.assertions(3);
    startScanMock.mockImplementationOnce(() => {
        return new Observable();
    });
    stopScanMock.mockImplementationOnce(() => {
        return Promise.resolve();
    });
    const onStartScanComplete = bluetoothAndroidDecorator
        .startScan([])
        .toPromise();
    await expect(bluetoothAndroidDecorator.stopScan()).resolves.toBeUndefined();
    await expect(onStartScanComplete).resolves.toBeUndefined();
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
