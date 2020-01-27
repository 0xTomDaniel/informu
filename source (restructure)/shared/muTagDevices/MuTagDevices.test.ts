import { MuTagDevices } from "./MuTagDevices";
import { Rssi } from "../metaLanguage/Types";
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

let discoveredPeripheralSubscriber: Subscriber<Peripheral>;
const discoveredPeripheral = new Observable<Peripheral>(subscriber => {
    discoveredPeripheralSubscriber = subscriber;
});
const BluetoothMock = jest.fn<Bluetooth, any>(
    (): Bluetooth => ({
        discoveredPeripheral: discoveredPeripheral,
        start: jest.fn(),
        startScan: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        read: jest.fn(),
        write: jest.fn()
    })
);

const bluetoothMock = new BluetoothMock();
const muTagDevices = new MuTagDevices(bluetoothMock);

const manufacturerDataBytes = new Uint8Array([
    2,
    1,
    6,
    26,
    255,
    76,
    0,
    2,
    21,
    222,
    126,
    199,
    237,
    16,
    85,
    176,
    85,
    192,
    222,
    222,
    254,
    167,
    237,
    250,
    126,
    255,
    255,
    255,
    255,
    182,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]);
const manufacturerData: ManufacturerData = {
    bytes: manufacturerDataBytes,
    data:
        "AgEGGv9MAAIV3n7H7RBVsFXA3t7+p+36fv////+2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    CDVType: "ArrayBuffer"
};
const discoveredPeripheral01: Peripheral = {
    id: uuidV4() as PeripheralId,
    name: "informu beacon",
    rssi: -55 as Rssi,
    advertising: {
        isConnectable: true,
        serviceUUIDs: [],
        manufacturerData: manufacturerData,
        serviceData: {},
        txPowerLevel: 6
    }
};

test("successfully finds two unprovisioned Mu tags", async (): Promise<
    void
> => {
    const discoveredPeripheral02: Peripheral = {
        id: uuidV4() as PeripheralId,
        name: "informu beacon",
        rssi: -55 as Rssi,
        advertising: {
            isConnectable: true,
            serviceUUIDs: [],
            manufacturerData: manufacturerData,
            serviceData: {},
            txPowerLevel: 6
        }
    };

    (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
        discoveredPeripheralSubscriber.next(discoveredPeripheral01);
        discoveredPeripheralSubscriber.next(discoveredPeripheral02);
    });
    (bluetoothMock.connect as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.disconnect as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.write as jest.Mock).mockResolvedValue(undefined);
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
                expect(unprovisionedMuTag.uid).toBeDefined();
                expect(typeof unprovisionedMuTag.uid).toBe("string");
                expect(typeof unprovisionedMuTag.batteryLevel).toBeDefined();
                expect(typeof unprovisionedMuTag.batteryLevel.valueOf()).toBe(
                    "number"
                );
                if (foundMuTagCount === 2) {
                    resolve();
                }
            }
        );

        const proximityThreshold = -72 as Rssi;
        muTagDevices
            .startFindingUnprovisionedMuTags(proximityThreshold)
            .catch(e => reject(e));
    });
    subscription?.unsubscribe();
});

test("successfully provisions previously found Mu tag", async (): Promise<
    void
> => {
    const accountNumber = AccountNumber.fromString("0000007");
    const beaconId = BeaconId;
    await muTagDevices.provisionMuTag();
});

/*test("successfully unprovisions previously provisioned Mu tag", async (): Promise<
    void
> => {

}*/
