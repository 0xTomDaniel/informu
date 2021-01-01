import { Rssi, Millisecond } from "../metaLanguage/Types";
import BluetoothPort, {
    Peripheral,
    PeripheralId,
    ScanMode,
    BluetoothException,
    ExceptionType
} from "../bluetooth/BluetoothPort";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Observable, Subscriber, Subject, EMPTY, BehaviorSubject } from "rxjs";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { Buffer } from "buffer";
import { take, toArray, switchMap, skip } from "rxjs/operators";
import BluetoothAndroidDecorator from "../bluetooth/BluetoothAndroidDecorator";
import { fakeSchedulers } from "rxjs-marbles/jest";
import EventTracker from "../metaLanguage/EventTracker";
import Logger from "../metaLanguage/Logger";
import MuTagDevices from "./MuTagDevices";
import {
    UnprovisionedMuTag,
    Connection,
    AdvertisingIntervalSetting,
    MuTagDevicesException
} from "./MuTagDevicesPort";

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

const connections = new Map<PeripheralId, Subscriber<void>>();
let connectionError: BluetoothException<ExceptionType> | undefined;
const connectMock = jest.fn<
    Observable<void>,
    [PeripheralId, Millisecond | undefined]
>((peripheralId: PeripheralId) => {
    return new Observable<void>(subscriber => {
        connections.set(peripheralId, subscriber);
        if (connectionError == null) {
            subscriber.next();
        } else {
            subscriber.error(connectionError);
        }
    });
});
const disconnectMock = jest.fn<Promise<void>, [PeripheralId]>(
    (peripheralId: PeripheralId) =>
        new Promise(resolve => {
            const subscriber = connections.get(peripheralId);
            subscriber?.complete();
            connections.delete(peripheralId);
            resolve();
        })
);
const readMock = jest.fn<
    Promise<any>,
    [PeripheralId, ReadableCharacteristic<any>]
>();
const startScanSubscriber = new BehaviorSubject<
    Subscriber<Peripheral> | undefined
>(undefined);
const startScanMock = jest.fn<
    Observable<Peripheral>,
    [Array<string>, Millisecond | undefined, ScanMode | undefined]
>(
    (uuids, timeout) =>
        new Observable(subscriber => {
            let timeoutId: NodeJS.Timeout | undefined;
            if (timeout != null) {
                timeoutId = setTimeout(() => {
                    subscriber.error(BluetoothException.ScanTimeout);
                }, timeout);
            }
            const teardown = () => {
                if (timeoutId != null) {
                    clearTimeout(timeoutId);
                }
            };
            startScanSubscriber.next(subscriber);
            return teardown;
        })
);
const stopScanMock = jest.fn<Promise<void>, []>(() => {
    startScanSubscriber.value?.complete();
    startScanSubscriber.next(undefined);
    return Promise.resolve();
});
const writeMock = jest.fn<
    Promise<void>,
    [PeripheralId, WritableCharacteristic<any>, any]
>(() => Promise.resolve());
const BluetoothMock = jest.fn(
    (): BluetoothPort => ({
        cancelTask: jest.fn(),
        connect: connectMock,
        disconnect: disconnectMock,
        read: readMock,
        startScan: startScanMock,
        stopScan: stopScanMock,
        write: writeMock
    })
);
const bluetoothMock = new BluetoothMock();
const bluetoothAndroidDecorator = new BluetoothAndroidDecorator(bluetoothMock);
const muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);

const unprovisionedManufacturerDataJson =
    "[2, 1, 6, 26, 255, 76, 0, 2, 21, 222, 126, 199, 237, 16, 85, 176, 85, 192, 222, 222, 254, 167, 237, 250, 126, 255, 255, 255, 255, 182, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]";
const unprovisionedManufacturerData = Buffer.from(
    JSON.parse(unprovisionedManufacturerDataJson)
);
const discoveredUnprovisionedPeripheral01: Peripheral = {
    id: uuidV4() as PeripheralId,
    name: "informu beacon",
    rssi: -55 as Rssi,
    advertising: {
        isConnectable: true,
        serviceUuids: [],
        manufacturerData: unprovisionedManufacturerData,
        serviceData: {},
        txPowerLevel: 6
    }
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

let unprovisionedMuTag: UnprovisionedMuTag;

test(
    "Finding unprovisioned Mu tags times out.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        const proximityThreshold = -72 as Rssi;
        const timeout = 5000 as Millisecond;
        const startFindingPromise = muTagDevices
            .startFindingUnprovisionedMuTags(proximityThreshold, timeout)
            .toPromise();
        advance(5000);
        const originatingError = BluetoothException.ScanTimeout;
        const error = MuTagDevicesException.FindNewMuTagTimeout(
            originatingError
        );
        await expect(startFindingPromise).rejects.toEqual(error);
    })
);

test("Successfully finds two unprovisioned Mu tags.", async () => {
    expect.assertions(1);
    const discoveredUnprovisionedPeripheral02: Peripheral = {
        id: uuidV4() as PeripheralId,
        name: "informu beacon",
        rssi: -55 as Rssi,
        advertising: {
            isConnectable: true,
            serviceUuids: [],
            manufacturerData: unprovisionedManufacturerData,
            serviceData: {},
            txPowerLevel: 6
        }
    };
    startScanSubscriber.pipe(skip(1), take(1)).subscribe(subscriber => {
        subscriber?.next(discoveredUnprovisionedPeripheral01);
        subscriber?.next(discoveredUnprovisionedPeripheral02);
    });
    const proximityThreshold = -72 as Rssi;
    const timeout = 5000 as Millisecond;
    const foundMuTagsSubject = new Subject<UnprovisionedMuTag>();
    const foundMuTagsPromise = foundMuTagsSubject
        .pipe(take(2), toArray())
        .toPromise();
    const startFindingCompleted = muTagDevices
        .startFindingUnprovisionedMuTags(proximityThreshold, timeout)
        .pipe(
            switchMap(muTag => {
                foundMuTagsSubject.next(muTag);
                return EMPTY;
            })
        )
        .toPromise();
    const foundMuTags = await foundMuTagsPromise;
    await muTagDevices.stopFindingUnprovisionedMuTags();
    await startFindingCompleted;
    unprovisionedMuTag = foundMuTags[0];
    const unprovisionedMuTag01 = {
        batteryLevel: undefined,
        macAddress: discoveredUnprovisionedPeripheral01.id,
        rssi: discoveredUnprovisionedPeripheral01.rssi
    };
    const unprovisionedMuTag02 = {
        batteryLevel: undefined,
        macAddress: discoveredUnprovisionedPeripheral02.id,
        rssi: discoveredUnprovisionedPeripheral02.rssi
    };
    expect(foundMuTags).toStrictEqual([
        unprovisionedMuTag01,
        unprovisionedMuTag02
    ]);
});

const accountNumber = AccountNumber.fromString("0000007");
const beaconId = BeaconId.fromNumber(5);

test("Successfully provisions an unprovisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(1);
    const connectedSubject = new Subject<Connection>();
    const connectedPromise = connectedSubject.pipe(take(1)).toPromise();
    const connectionCompleted = muTagDevices
        .connectToUnprovisionedMuTag(unprovisionedMuTag)
        .pipe(
            switchMap(connection => {
                connectedSubject.next(connection);
                return EMPTY;
            })
        )
        .toPromise();
    const connection = await connectedPromise;
    const batteryLevel01 = new Percent(96);
    readMock.mockResolvedValueOnce(batteryLevel01);
    await expect(
        muTagDevices.provisionMuTag(
            accountNumber,
            beaconId,
            connection,
            new Percent(25)
        )
    ).resolves.toBeUndefined();
    await muTagDevices.disconnectFromMuTag(connection);
    await connectionCompleted;
});

const provisionedManufacturerDataJson =
    "[2, 1, 6, 26, 255, 76, 0, 2, 21, 222, 126, 199, 237, 16, 85, 176, 85, 192, 222, 222, 254, 167, 237, 250, 126, 0, 0, 0, 117, 182, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]";
const provisionedManufacturerData = Buffer.from(
    JSON.parse(provisionedManufacturerDataJson)
);
const discoveredProvisionedPeripheral: Peripheral = {
    id: uuidV4() as PeripheralId,
    name: "informu beacon",
    rssi: -55 as Rssi,
    advertising: {
        isConnectable: true,
        serviceUuids: [],
        manufacturerData: provisionedManufacturerData,
        serviceData: {},
        txPowerLevel: 6
    }
};

const timeout = 5000 as Millisecond;

test(
    "Successfully connects to provisioned Mu tag.",
    fakeSchedulers(async advance => {
        jest.useFakeTimers("modern");
        expect.assertions(1);
        startScanSubscriber
            .pipe(skip(1), take(1))
            .subscribe(subscriber =>
                subscriber?.next(discoveredProvisionedPeripheral)
            );
        const connection = await muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
            .pipe(take(1))
            .toPromise();
        advance(500);
        await expect(
            muTagDevices.disconnectFromMuTag(connection)
        ).resolves.toBeUndefined();
    })
);

test(
    "Fails to find provisioned Mu tag.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
            .toPromise();
        advance(5000);
        const originatingError = BluetoothException.ScanTimeout;
        const error = MuTagDevicesException.FailedToFindMuTag(originatingError);
        await expect(connectPromise).rejects.toEqual(error);
    })
);

test("Fails to connect to provisioned Mu tag.", async () => {
    expect.assertions(1);
    connectionError = BluetoothException.FailedToConnect(
        discoveredProvisionedPeripheral.id
    );
    startScanSubscriber
        .pipe(skip(1), take(1))
        .subscribe(subscriber =>
            subscriber?.next(discoveredProvisionedPeripheral)
        );
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
        .toPromise();
    const originatingError = BluetoothException.FailedToConnect(
        discoveredProvisionedPeripheral.id
    );
    const error = MuTagDevicesException.FailedToConnectToMuTag(
        originatingError
    );
    await expect(connectPromise).rejects.toStrictEqual(error);
    connectionError = undefined;
});

test("Successfully disconnects from provisioned Mu tag.", async () => {
    expect.assertions(2);
    startScanSubscriber
        .pipe(skip(1), take(1))
        .subscribe(subscriber =>
            subscriber?.next(discoveredProvisionedPeripheral)
        );
    const connectedSubject = new Subject<Connection>();
    const connectedPromise = connectedSubject.pipe(take(1)).toPromise();
    let didConnectionComplete = false;
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
        .pipe(
            switchMap(connection => {
                connectedSubject.next(connection);
                return EMPTY;
            })
        )
        .toPromise()
        .then(() => (didConnectionComplete = true));
    const connection = await connectedPromise;
    expect(didConnectionComplete).toBeFalsy();
    await expect(
        muTagDevices.disconnectFromMuTag(connection)
    ).resolves.toBeUndefined();
    await connectPromise;
});

test("Successfully changes advertising interval of provisioned Mu tag.", async () => {
    expect.assertions(3);
    startScanSubscriber
        .pipe(skip(1), take(1))
        .subscribe(subscriber =>
            subscriber?.next(discoveredProvisionedPeripheral)
        );
    const connection = await muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
        .pipe(take(1))
        .toPromise();
    await expect(
        muTagDevices.changeAdvertisingInterval(
            AdvertisingIntervalSetting["852 ms"],
            connection
        )
    ).resolves.toBeUndefined();
    expect(writeMock).toHaveBeenNthCalledWith(
        2,
        discoveredProvisionedPeripheral.id,
        MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
        Hexadecimal.fromString("03")
    );
    await expect(
        muTagDevices.disconnectFromMuTag(connection)
    ).resolves.toBeUndefined();
});

test(
    "Successfully unprovisions a provisioned Mu tag.",
    fakeSchedulers(async advance => {
        expect.assertions(4);
        jest.useFakeTimers("modern");
        startScanSubscriber
            .pipe(skip(1), take(1))
            .subscribe(subscriber =>
                subscriber?.next(discoveredProvisionedPeripheral)
            );
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId, timeout)
            .pipe(take(1))
            .toPromise();
        const connection = await connectPromise;
        const unprovisionPromise = muTagDevices.unprovisionMuTag(connection);
        // Wait for disconnect to complete.
        advance(500);
        await expect(unprovisionPromise).resolves.toBeUndefined();
        expect(writeMock).toHaveBeenNthCalledWith(
            2,
            discoveredProvisionedPeripheral.id,
            MuTagBleGatt.MuTagConfiguration.Provision,
            MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
        );
        // Must ensure connection is closed and that scan executes successfully.
        const findUnprovisionedMuTagsPromise = muTagDevices
            .startFindingUnprovisionedMuTags(-72 as Rssi, 15000 as Millisecond)
            .toPromise();
        await expect(
            muTagDevices.stopFindingUnprovisionedMuTags()
        ).resolves.toBeUndefined();
        await expect(findUnprovisionedMuTagsPromise).resolves.toBeUndefined();
    })
);
