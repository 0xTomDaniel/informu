import MuTagDevices from "./MuTagDevices";
import { Rssi, Millisecond } from "../metaLanguage/Types";
import Bluetooth, {
    Peripheral,
    ManufacturerData,
    PeripheralId
} from "./Bluetooth";
import { v4 as uuidV4 } from "uuid";
import Percent from "../metaLanguage/Percent";
import { Observable, Subscriber, Subscription } from "rxjs";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { BeaconId } from "../../../source/Core/Domain/ProvisionedMuTag";
import { UnprovisionedMuTag } from "../../useCases/addMuTag/MuTagDevicesPort";

let discoveredPeripheralSubscriber: Subscriber<Peripheral>;
const discoveredPeripheral = new Observable<Peripheral>(subscriber => {
    discoveredPeripheralSubscriber = subscriber;
});
const BluetoothMock = jest.fn<Bluetooth, any>(
    (): Bluetooth => ({
        discoveredPeripheral: discoveredPeripheral,
        start: jest.fn(),
        startScan: jest.fn(),
        stopScan: jest.fn(),
        retrieveServices: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        read: jest.fn(),
        write: jest.fn()
    })
);
const bluetoothMock = new BluetoothMock();
(bluetoothMock.start as jest.Mock).mockResolvedValue(undefined);
(bluetoothMock.retrieveServices as jest.Mock).mockResolvedValue({});
(bluetoothMock.stopScan as jest.Mock).mockResolvedValue(undefined);
(bluetoothMock.connect as jest.Mock).mockResolvedValue(undefined);
(bluetoothMock.disconnect as jest.Mock).mockResolvedValue(undefined);
(bluetoothMock.write as jest.Mock).mockResolvedValue(undefined);
const muTagDevices = new MuTagDevices(bluetoothMock);

const manufacturerDataJson =
    "[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
const manufacturerDataBytes = new Uint8Array(JSON.parse(manufacturerDataJson));
const manufacturerDataBase64 =
    "AgEGGv9MAAIV3n7H7RBVsFXA3t7+p+36fv////+2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const manufacturerData: ManufacturerData = {
    bytes: manufacturerDataBytes,
    data: manufacturerDataBase64,
    cdvType: "ArrayBuffer"
};
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

test("successfully starts bluetooth", async (): Promise<void> => {
    expect(bluetoothMock.start).toHaveBeenCalled();
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

    (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
        discoveredPeripheralSubscriber.next(discoveredPeripheral01);
        discoveredPeripheralSubscriber.next(discoveredPeripheral02);
    });
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(new Percent(96));
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(new Percent(38));

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
    (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
        discoveredPeripheralSubscriber.next(discoveredPeripheralUncached);
    });
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce("01");
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce("0000");
    (bluetoothMock.read as jest.Mock).mockResolvedValueOnce("0072");
    const accountNumberUncached = AccountNumber.fromString("0000007");
    const beaconIdUncached = BeaconId.fromNumber(2);
    await muTagDevices.unprovisionMuTag(
        accountNumberUncached,
        beaconIdUncached
    );
});
