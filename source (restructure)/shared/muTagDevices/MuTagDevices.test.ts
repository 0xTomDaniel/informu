import MuTagDevices from "./MuTagDevices";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Observable, Subscriber, Subject } from "rxjs";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import {
    UnprovisionedMuTag,
    AdvertisingIntervalSetting,
    MuTagDeviceId
} from "../../useCases/addMuTag/MuTagDevicesPort";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { Buffer } from "buffer";
import { take, toArray, filter, mapTo } from "rxjs/operators";
import BluetoothAndroidDecorator from "../bluetooth/BluetoothAndroidDecorator";
import { fakeSchedulers } from "rxjs-marbles/jest";
import EventTracker from "../metaLanguage/EventTracker";
import Logger from "../metaLanguage/Logger";

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
            const teardown = () => subscription.unsubscribe();
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
let muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);

const manufacturerDataJson =
    "[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
const manufacturerData = Buffer.from(JSON.parse(manufacturerDataJson));
const discoveredPeripheral01: Peripheral = {
    id: uuidV4() as PeripheralId,
    name: "informu beacon",
    rssi: -55 as Rssi,
    advertising: {
        isConnectable: true,
        serviceUuids: [],
        manufacturerData: manufacturerData,
        serviceData: {},
        txPowerLevel: 6
    }
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

let unprovisionedMuTag: UnprovisionedMuTag;

test("successfully finds two unprovisioned Mu tags.", async () => {
    expect.assertions(1);
    const discoveredPeripheral02: Peripheral = {
        id: uuidV4() as PeripheralId,
        name: "informu beacon",
        rssi: -55 as Rssi,
        advertising: {
            isConnectable: true,
            serviceUuids: [],
            manufacturerData: manufacturerData,
            serviceData: {},
            txPowerLevel: 6
        }
    };
    readMock.mockResolvedValueOnce(undefined);
    readMock.mockResolvedValueOnce(undefined);
    const batteryLevel01 = new Percent(96);
    const batteryLevel02 = new Percent(38);
    readMock.mockResolvedValueOnce(batteryLevel01);
    readMock.mockResolvedValueOnce(batteryLevel02);
    const proximityThreshold = -72 as Rssi;
    const timeout = 5000 as Millisecond;
    const foundMuTagsPromise = muTagDevices
        .startFindingUnprovisionedMuTags(proximityThreshold, timeout)
        .pipe(toArray())
        .toPromise();
    discoveredPeripheralSubject.next(discoveredPeripheral01);
    discoveredPeripheralSubject.next(discoveredPeripheral02);
    muTagDevices.stopFindingUnprovisionedMuTags();
    const foundMuTags = await foundMuTagsPromise;
    unprovisionedMuTag = foundMuTags[0];
    const unprovisionedMuTag01 = {
        id: discoveredPeripheral01.id,
        batteryLevel: batteryLevel01,
        macAddress: discoveredPeripheral01.id
    };
    const unprovisionedMuTag02 = {
        id: discoveredPeripheral02.id,
        batteryLevel: batteryLevel02,
        macAddress: discoveredPeripheral02.id
    };
    expect(foundMuTags).toStrictEqual([
        unprovisionedMuTag01,
        unprovisionedMuTag02
    ]);
});

const accountNumber = AccountNumber.fromString("0000007");
const beaconId = BeaconId.fromNumber(5);
let provisionedMuTagDeviceId: MuTagDeviceId;

test("successfully provisions an unprovisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(1);
    await expect(
        muTagDevices.provisionMuTag(
            unprovisionedMuTag.id,
            accountNumber,
            beaconId
        )
    ).resolves.toBeUndefined();
    provisionedMuTagDeviceId = unprovisionedMuTag.id;
});

test("successfully connects to previously provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(1);
    const connectPromise = muTagDevices
        .connectToProvisionedMuTag(accountNumber, beaconId)
        .pipe(take(1))
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
    await muTagDevices.disconnectFromProvisionedMuTag(accountNumber, beaconId);
});

test(
    "fails to connect to provisioned Mu tag that's not cached.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);
        const provisionedResponse = Hexadecimal.fromString("01");
        readMock.mockResolvedValueOnce(provisionedResponse);
        const majorResponse = Hexadecimal.fromString("0000");
        readMock.mockResolvedValueOnce(majorResponse);
        const minorResponse = Hexadecimal.fromString("0075");
        readMock.mockResolvedValueOnce(minorResponse);
        connectionError = Error("Failed to connected to Mu tag.");
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId)
            .pipe(take(1))
            .toPromise();
        discoveredPeripheralSubject.next(discoveredPeripheral01);
        advance(500);
        await expect(connectPromise).rejects.toBe(connectionError);
        await muTagDevices.disconnectFromProvisionedMuTag(
            accountNumber,
            beaconId
        );
        connectionError = undefined;
    })
);

/*test(
    "fails to connect to provisioned Mu tag that's cached.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);
        const provisionedResponse = Hexadecimal.fromString("01");
        readMock.mockResolvedValueOnce(provisionedResponse);
        const majorResponse = Hexadecimal.fromString("0000");
        readMock.mockResolvedValueOnce(majorResponse);
        const minorResponse = Hexadecimal.fromString("0075");
        readMock.mockResolvedValueOnce(minorResponse);
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId)
            .pipe(take(1))
            .toPromise();
        discoveredPeripheralSubject.next(discoveredPeripheral01);
        advance(500);
        await expect(connectPromise).resolves.toBeUndefined();
        await muTagDevices.disconnectFromProvisionedMuTag(
            accountNumber,
            beaconId
        );
    })
);*/

test(
    "successfully connects to provisioned Mu tag that's not cached.",
    fakeSchedulers(async advance => {
        expect.assertions(1);
        jest.useFakeTimers("modern");
        /*muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);
        const provisionedResponse = Hexadecimal.fromString("01");
        readMock.mockResolvedValueOnce(provisionedResponse);
        const majorResponse = Hexadecimal.fromString("0000");
        readMock.mockResolvedValueOnce(majorResponse);
        const minorResponse = Hexadecimal.fromString("0075");
        readMock.mockResolvedValueOnce(minorResponse);*/
        const connectPromise = muTagDevices
            .connectToProvisionedMuTag(accountNumber, beaconId)
            .pipe(take(1))
            .toPromise();
        discoveredPeripheralSubject.next(discoveredPeripheral01);
        advance(500);
        await expect(connectPromise).resolves.toBeUndefined();
        await muTagDevices.disconnectFromProvisionedMuTag(
            accountNumber,
            beaconId
        );
    })
);

test("successfully disconnects from provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(2);
    enum ConnectionState {
        Connected,
        Disconnected
    }
    const connectionState = new Subject<ConnectionState>();
    const connectPromise: Promise<void> = connectionState
        .pipe(
            filter(state => state === ConnectionState.Connected),
            take(1),
            mapTo(undefined)
        )
        .toPromise();
    const disconnectPromise: Promise<void> = connectionState
        .pipe(
            filter(state => state === ConnectionState.Disconnected),
            take(1),
            mapTo(undefined)
        )
        .toPromise();
    muTagDevices.connectToProvisionedMuTag(accountNumber, beaconId).subscribe(
        () => connectionState.next(ConnectionState.Connected),
        e => connectionState.error(e),
        () => connectionState.next(ConnectionState.Disconnected)
    );
    await expect(connectPromise).resolves.toBeUndefined();
    await muTagDevices.disconnectFromProvisionedMuTag(accountNumber, beaconId);
    await expect(disconnectPromise).resolves.toBeUndefined();
});

test("successfully changes advertising interval of provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(2);
    await expect(
        muTagDevices.changeAdvertisingInterval(
            AdvertisingIntervalSetting["852 ms"],
            accountNumber,
            beaconId
        )
    ).resolves.toBeUndefined();
    expect(writeMock).toHaveBeenNthCalledWith(
        1,
        provisionedMuTagDeviceId,
        MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
        Hexadecimal.fromString("03")
    );
});

test("successfully unprovisions previously provisioned Mu tag.", async (): Promise<
    void
> => {
    expect.assertions(1);
    await expect(
        muTagDevices.unprovisionMuTag(accountNumber, beaconId)
    ).resolves.toBeUndefined();
});
