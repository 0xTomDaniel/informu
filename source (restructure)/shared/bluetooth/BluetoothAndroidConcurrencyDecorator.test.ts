import BluetoothPort, {
    PeripheralId,
    Peripheral,
    ScanMode,
    BluetoothError
} from "./BluetoothPort";
import { Millisecond } from "../metaLanguage/Types";
import { Observable, Subject, BehaviorSubject, Subscriber } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic,
    UTF8Characteristic
} from "./Characteristic";
import BluetoothAndroidConcurrencyDecorator from "./BluetoothAndroidConcurrencyDecorator";
import { v4 as uuidV4 } from "uuid";
import { take, filter } from "rxjs/operators";
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
let bluetoothAndroidConcurrencyDecorator: BluetoothAndroidConcurrencyDecorator;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    bluetoothAndroidConcurrencyDecorator = new BluetoothAndroidConcurrencyDecorator(
        bluetoothMock
    );
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
    const onStartScanComplete = bluetoothAndroidConcurrencyDecorator
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
    bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
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
    bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
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
    bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
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
    await bluetoothAndroidConcurrencyDecorator.stopScan();
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
    "Run scan for a minimum of 500ms since starting and then pause (stop) scan when at least one connect request is received, and repeat.",
    fakeSchedulers(async advance => {
        expect.assertions(6);
        jest.useFakeTimers("modern");
        const scanStoppedSubject = new BehaviorSubject<boolean>(false);
        let startScanSubscriber01: Subscriber<Peripheral> | undefined;
        startScanMock.mockReturnValueOnce(
            new Observable(subscriber => {
                startScanSubscriber01 = subscriber;
                const teardown = () => scanStoppedSubject.next(true);
                return teardown;
            })
        );
        stopScanMock.mockImplementationOnce(() => {
            startScanSubscriber01?.complete();
            return Promise.resolve();
        });
        let startScanSubscriber02: Subscriber<Peripheral> | undefined;
        startScanMock.mockReturnValueOnce(
            new Observable(subscriber => {
                scanStoppedSubject.next(false);
                startScanSubscriber02 = subscriber;
                const teardown = () => scanStoppedSubject.next(true);
                return teardown;
            })
        );
        stopScanMock.mockImplementationOnce(() => {
            startScanSubscriber02?.complete();
            return Promise.resolve();
        });
        const executionOrder: number[] = [];
        let didScanComplete = false;
        const startScanSubscription = bluetoothAndroidConcurrencyDecorator
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
        bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
            () => {
                connectionEstablishedSubject01.next();
            },
            undefined,
            () => {
                connectionCompleteSubject01.next();
            }
        );
        const onScanPaused01 = scanStoppedSubject
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
            onScanPaused01,
            onConnectionEstablished01,
            onConnectionComplete01
        ]);
        const connectionEstablishedSubject02 = new Subject<void>();
        const connectionCompleteSubject02 = new Subject<void>();
        bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
            () => {
                connectionEstablishedSubject02.next();
            },
            undefined,
            () => {
                connectionCompleteSubject02.next();
            }
        );
        const onScanPaused02 = scanStoppedSubject
            .pipe(
                filter(isStopped => isStopped),
                take(1)
            )
            .toPromise()
            .then(() => executionOrder.push(4));
        const onConnectionEstablished02 = connectionEstablishedSubject02
            .pipe(take(1))
            .toPromise()
            .then(() => executionOrder.push(5));
        const onConnectionComplete02 = connectionCompleteSubject02
            .pipe(take(1))
            .toPromise()
            .then(() => executionOrder.push(6));
        advance(499);
        expect(scanStoppedSubject.value).toBeFalsy();
        advance(1);
        expect(scanStoppedSubject.value).toBeTruthy();
        await Promise.all([
            onScanPaused02,
            onConnectionEstablished02,
            onConnectionComplete02
        ]);
        expect(executionOrder).toStrictEqual([1, 2, 3, 4, 5, 6]);
        expect(didScanComplete).toBeFalsy();
        startScanSubscription.unsubscribe();
    })
);

test("Queue scan request while connection is open then start scanning after connection has closed.", async () => {
    expect.assertions(1);
    const connectionEstablishedSubject01 = new Subject<void>();
    const connectionCompleteSubject01 = new Subject<void>();
    bluetoothAndroidConcurrencyDecorator.connect(peripheralId).subscribe(
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
    const onScanStarted = bluetoothAndroidConcurrencyDecorator
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
    const startScanPromise = bluetoothAndroidConcurrencyDecorator
        .startScan(serviceUuids)
        .toPromise();
    await expect(startScanPromise).rejects.toThrow(error);
    connectMock.mockReturnValue(
        new Observable<void>(subscriber => {
            subscriber.next();
            subscriber.complete();
        })
    );
    const connectPromise = bluetoothAndroidConcurrencyDecorator
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
    const startScanPromise01 = bluetoothAndroidConcurrencyDecorator
        .startScan(serviceUuids)
        .toPromise();
    await expect(startScanPromise01).rejects.toThrow(error);
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const startScanPromise02 = bluetoothAndroidConcurrencyDecorator
        .startScan(serviceUuids)
        .pipe(take(1))
        .toPromise();
    await expect(startScanPromise02).resolves.toBeUndefined();
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
    const startScanPromise = bluetoothAndroidConcurrencyDecorator
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
        expect.assertions(4);
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
        const startScanPromise = bluetoothAndroidConcurrencyDecorator
            .startScan(serviceUuids, timeout)
            .toPromise();
        await expect(startScanPromise).resolves.toBeUndefined();
        expect(startScanMock).toBeCalledTimes(1);
        expect(startScanMock).toBeCalledWith(serviceUuids, timeout, undefined);
        expect(stopScanMock).toBeCalledTimes(1);
    })
);

test("Fail to start Bluetooth scan again before first completes.", async () => {
    expect.assertions(2);
    startScanMock.mockReturnValue(
        new Observable(subscriber => subscriber.next())
    );
    const startScanPromise01 = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    const startScanPromise02 = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .toPromise();
    const error = BluetoothError.ScanAlreadyStarted;
    await expect(startScanPromise02).rejects.toThrow(error);
    bluetoothAndroidConcurrencyDecorator.stopScan();
    await expect(startScanPromise01).resolves.toBeUndefined();
});

test("Fail to start Bluetooth scan.", async () => {
    expect.assertions(3);
    const error = Error("Failed to start Bluetooth scan.");
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.error(error))
    );
    const startScanPromise = bluetoothAndroidConcurrencyDecorator
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
    const startScanPromise = bluetoothAndroidConcurrencyDecorator
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
    const onStartScanComplete = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .toPromise();
    await expect(
        bluetoothAndroidConcurrencyDecorator.stopScan()
    ).resolves.toBeUndefined();
    await expect(onStartScanComplete).resolves.toBeUndefined();
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
    const onScanStarted01 = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    await expect(onScanStarted01).resolves.toBeUndefined();
    await expect(
        bluetoothAndroidConcurrencyDecorator.stopScan()
    ).resolves.toBeUndefined();
    // Verifies that scan state was "Stopped", otherwise an error would be
    // thrown.
    const onScanStarted02 = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .pipe(take(1))
        .toPromise();
    await expect(onScanStarted02).resolves.toBeUndefined();
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Fail to stop Bluetooth scan.", async () => {
    expect.assertions(2);
    const startSubscription = bluetoothAndroidConcurrencyDecorator
        .startScan([])
        .subscribe();
    const error = Error("Failed to stop Bluetooth scan.");
    stopScanMock.mockRejectedValueOnce(error);
    await expect(
        bluetoothAndroidConcurrencyDecorator.stopScan()
    ).rejects.toThrow(error);
    startSubscription.unsubscribe();
    expect(stopScanMock).toBeCalledTimes(1);
});

test("Successfully connect to Bluetooth device.", async () => {
    expect.assertions(3);
    connectMock.mockReturnValueOnce(
        new Observable(subscriber => subscriber.next())
    );
    const timeout = 15000 as Millisecond;
    const connectPromise = bluetoothAndroidConcurrencyDecorator
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
    const connectPromise = bluetoothAndroidConcurrencyDecorator
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
        bluetoothAndroidConcurrencyDecorator.disconnect(peripheralId)
    ).resolves.toBeUndefined();
    expect(disconnectMock).toBeCalledTimes(1);
    expect(disconnectMock).toBeCalledWith(peripheralId);
});

test("Fail to disconnect from Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to disconnect from Bluetooth device.");
    disconnectMock.mockRejectedValueOnce(error);
    await expect(
        bluetoothAndroidConcurrencyDecorator.disconnect(peripheralId)
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
        bluetoothAndroidConcurrencyDecorator.read(peripheralId, characteristic)
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
        bluetoothAndroidConcurrencyDecorator.read(peripheralId, characteristic)
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
        bluetoothAndroidConcurrencyDecorator.write(
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
        bluetoothAndroidConcurrencyDecorator.write(
            peripheralId,
            characteristic,
            writeValue
        )
    ).rejects.toThrow(error);
    expect(writeMock).toBeCalledTimes(1);
    expect(writeMock).toBeCalledWith(peripheralId, characteristic, writeValue);
});
