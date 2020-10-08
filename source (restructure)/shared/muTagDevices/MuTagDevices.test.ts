import MuTagDevices from "./MuTagDevices";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../bluetooth/Bluetooth";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Observable, Subscriber, Subscription } from "rxjs";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import {
    UnprovisionedMuTag,
    AdvertisingIntervalSetting
} from "../../useCases/addMuTag/MuTagDevicesPort";
import { MuTagBleGatt } from "./MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "../bluetooth/Characteristic";
import { Buffer } from "buffer";

const connections = new Map<PeripheralId, Subscriber<void>>();
const connectMock = jest.fn<
    Observable<void>,
    [PeripheralId, Millisecond | undefined]
>(
    (peripheralId: PeripheralId) =>
        new Observable<void>(subscriber => {
            connections.set(peripheralId, subscriber);
            subscriber.next();
        })
);
const disconnectMock = jest.fn<Promise<void>, [PeripheralId]>(
    (peripheralId: PeripheralId) =>
        new Promise(resolve => {
            const subscriber = connections.get(peripheralId);
            subscriber?.complete();
            connections.delete(peripheralId);
            resolve();
        })
);
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
const muTagDevices = new MuTagDevices(bluetoothMock);

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
let unprovisionedMuTag01: UnprovisionedMuTag;

beforeEach(() => {
    jest.clearAllMocks();
});

test("successfully finds two unprovisioned Mu tags", async (): Promise<
    void
> => {
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

    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => {
            subscriber.next(discoveredPeripheral01);
            subscriber.next(discoveredPeripheral02);
        })
    );
    /*(bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(new Percent(96));
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(new Percent(38));*/
    readMock.mockResolvedValueOnce(new Percent(96));
    readMock.mockResolvedValueOnce(new Percent(38));

    expect.assertions(8);
    let subscription: Subscription | undefined;
    await new Promise((resolve, reject) => {
        let foundMuTagCount = 0;
        subscription = muTagDevices.unprovisionedMuTag.subscribe(
            unprovisionedMuTag => {
                foundMuTagCount += 1;
                expect(unprovisionedMuTag.id).toBeDefined();
                expect(typeof unprovisionedMuTag.id).toBe("string");
                expect(typeof unprovisionedMuTag.batteryLevel).toBeDefined();
                expect(typeof unprovisionedMuTag.batteryLevel.valueOf()).toBe(
                    "number"
                );
                switch (foundMuTagCount) {
                    case 1:
                        unprovisionedMuTag01 = unprovisionedMuTag;
                        break;
                    case 2:
                        resolve();
                        break;
                }
            }
        );

        const proximityThreshold = -72 as Rssi;
        const timeout = 5000 as Millisecond;
        muTagDevices
            .startFindingUnprovisionedMuTags(proximityThreshold, timeout)
            .catch(e => reject(e));
    });
    muTagDevices.stopFindingUnprovisionedMuTags();
    subscription?.unsubscribe();
});

const accountNumber = AccountNumber.fromString("0000007");
const beaconId = BeaconId.fromNumber(5);

test("successfully provisions previously found Mu tag", async (): Promise<
    void
> => {
    await muTagDevices.provisionMuTag(
        unprovisionedMuTag01.id,
        accountNumber,
        beaconId
    );
});

test("successfully changes advertising interval", async (): Promise<void> => {
    await muTagDevices.changeAdvertisingInterval(
        AdvertisingIntervalSetting["852 ms"],
        accountNumber,
        beaconId
    );
    expect(bluetoothMock.write).toHaveBeenNthCalledWith(
        7,
        unprovisionedMuTag01.id,
        MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
        Hexadecimal.fromString("03")
    );
});

test("successfully unprovisions previously provisioned Mu tag", async (): Promise<
    void
> => {
    await muTagDevices.unprovisionMuTag(accountNumber, beaconId);
});

test("successfully unprovisions provisioned Mu tag that's not cached", async (): Promise<
    void
> => {
    const discoveredPeripheralUncached: Peripheral = {
        id: uuidV4() as PeripheralId,
        name: "informu beacon",
        rssi: -67 as Rssi,
        advertising: {
            isConnectable: true,
            serviceUuids: [],
            manufacturerData: manufacturerData,
            serviceData: {},
            txPowerLevel: 6
        }
    };
    /*(bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
        (serviceUuids, timeout) => {
            discoveredPeripheralSubscriber.next(discoveredPeripheralUncached);
            return new Promise(resolve => setTimeout(() => resolve(), timeout));
        }
    );*/
    startScanMock.mockReturnValueOnce(
        new Observable(subscriber => {
            subscriber.next(discoveredPeripheralUncached);
        })
    );
    /*(bluetoothMock.read as jest.Mock).mockResolvedValueOnce("01");
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce("0000");
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce("0072");*/
    readMock.mockResolvedValueOnce("01");
    readMock.mockResolvedValueOnce("0000");
    readMock.mockResolvedValueOnce("0072");
    const accountNumberUncached = AccountNumber.fromString("0000007");
    const beaconIdUncached = BeaconId.fromNumber(2);
    await muTagDevices.unprovisionMuTag(
        accountNumberUncached,
        beaconIdUncached
    );
});
