import { Rssi, Millisecond } from "../metaLanguage/Types";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Observable, Subscriber, Subject, EMPTY } from "rxjs";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { Buffer } from "buffer";
import { take, toArray, switchMap } from "rxjs/operators";
import BluetoothAndroidDecorator from "../bluetooth/BluetoothAndroidDecorator";
import { fakeSchedulers } from "rxjs-marbles/jest";
import EventTracker from "../metaLanguage/EventTracker";
import Logger from "../metaLanguage/Logger";
import MuTagDevices from "./MuTagDevices";
import {
    UnprovisionedMuTag,
    Connection,
    AdvertisingIntervalSetting,
    FailedToConnectToMuTag,
    FailedToFindMuTag
} from "./MuTagDevicesPort";
import UserError from "../metaLanguage/UserError";

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

//const onConnectIsReady = new Subject<Subscriber<void>>();
const connections = new Map<PeripheralId, Subscriber<void>>();
let connectionError: Error | undefined;
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
let startScanSubscriber: Subscriber<Peripheral> | undefined;
const discoveredPeripheralSubject = new Subject<Peripheral>();
const scanTimeout = 5000;
const startScanMock = jest.fn<
    Observable<Peripheral>,
    [Array<string>, Millisecond | undefined, ScanMode | undefined]
>(
    () =>
        new Observable(subscriber => {
            startScanSubscriber = subscriber;
            const subscription = discoveredPeripheralSubject.subscribe(
                peripheral => subscriber.next(peripheral)
            );
            const timeoutId = setTimeout(() => {
                debugger;
                subscriber.complete();
            }, scanTimeout);
            const teardown = () => {
                debugger;
                clearTimeout(timeoutId);
                subscription.unsubscribe();
            };
            return teardown;
        })
);
const stopScanMock = jest.fn<Promise<void>, []>(() => {
    startScanSubscriber?.complete();
    return Promise.resolve();
});
const writeMock = jest.fn<
    Promise<void>,
    [PeripheralId, WritableCharacteristic<any>, any]
>(() => Promise.resolve());
const BluetoothMock = jest.fn(
    (): Bluetooth => ({
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
    discoveredPeripheralSubject.next(discoveredUnprovisionedPeripheral01);
    discoveredPeripheralSubject.next(discoveredUnprovisionedPeripheral02);
    const foundMuTags = await foundMuTagsPromise;
    muTagDevices.stopFindingUnprovisionedMuTags();
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

test("Successfully connects to provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(1);
    const connectedPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId)
        .pipe(take(1))
        .toPromise();
    discoveredPeripheralSubject.next(discoveredProvisionedPeripheral);
    await expect(connectedPromise).resolves.toStrictEqual(
        expect.any(Connection)
    );
});

test(
    "Fails to find provisioned Mu tag.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        debugger;
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId)
            .pipe(take(1))
            .toPromise();
        debugger;
        advance(5000);
        debugger;
        await expect(connectPromise).rejects.toStrictEqual(connectionError);
        debugger;
    })
);

/*test(
    "Fails to connect to provisioned Mu tag.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        connectionError = UserError.create(FailedToConnectToMuTag);
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId)
            .pipe(take(1))
            .toPromise();
        discoveredPeripheralSubject.next(discoveredProvisionedPeripheral);
        advance(500);
        await expect(connectPromise).rejects.toStrictEqual(connectionError);
        connectionError = undefined;
    })
);

test("Successfully disconnects from provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(2);
    const connectedSubject = new Subject<Connection>();
    const connectedPromise = connectedSubject.pipe(take(1)).toPromise();
    let didConnectionComplete = false;
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId)
        .pipe(
            switchMap(connection => {
                connectedSubject.next(connection);
                return EMPTY;
            })
        )
        .toPromise()
        .then(() => (didConnectionComplete = true));
    discoveredPeripheralSubject.next(discoveredProvisionedPeripheral);
    const connection = await connectedPromise;
    expect(didConnectionComplete).toBeFalsy();
    await expect(
        muTagDevices.disconnectFromMuTag(connection)
    ).resolves.toBeUndefined();
    await connectPromise;
});

test("Successfully changes advertising interval of provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(2);
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId)
        .pipe(take(1))
        .toPromise();
    discoveredPeripheralSubject.next(discoveredProvisionedPeripheral);
    const connection = await connectPromise;
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
});

test("Successfully unprovisions a provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(2);
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId)
        .pipe(take(1))
        .toPromise();
    discoveredPeripheralSubject.next(discoveredProvisionedPeripheral);
    const connection = await connectPromise;
    await expect(
        muTagDevices.unprovisionMuTag(connection)
    ).resolves.toBeUndefined();
    expect(writeMock).toHaveBeenNthCalledWith(
        2,
        discoveredProvisionedPeripheral.id,
        MuTagBleGatt.MuTagConfiguration.Provision,
        MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
    );
});*/
