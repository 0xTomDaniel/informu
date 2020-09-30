import ReactNativeBlePlxAdapter from "./ReactNativeBlePlxAdapter";
import {
    BleManager,
    Device,
    BleError,
    ScanOptions,
    Characteristic as RnBlePlxCharacteristic,
    DeviceId,
    NativeDevice,
    ConnectionOptions,
    Subscription,
    UUID,
    NativeCharacteristic
} from "react-native-ble-plx";
import { Subject, SubscriptionLike } from "rxjs";
import { v4 as uuidV4 } from "uuid";
import { Millisecond } from "../metaLanguage/Types";
import {
    ScanMode,
    Peripheral,
    PeripheralId,
    BluetoothError,
    BluetoothErrorType
} from "./Bluetooth";
import { take } from "rxjs/operators";
import { Buffer } from "buffer";
import {
    HexCharacteristic,
    ReadableCharacteristic,
    UTF8Characteristic,
    WritableCharacteristic
} from "./Characteristic";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import { fakeSchedulers } from "rxjs-marbles/jest";

const deviceScanErrorSubject = new Subject<BleError | null>();
const deviceScanFoundSubject = new Subject<Device | null>();
const startDeviceScan = jest.fn(
    (
        UUIDs: string[] | null,
        options: ScanOptions | null,
        listener: (error: BleError | null, scannedDevice: Device | null) => void
    ) => {
        const scanErrorSubscription = deviceScanErrorSubject.subscribe(e =>
            listener(e, null)
        );
        const scanFoundSubscription = deviceScanFoundSubject.subscribe(device =>
            listener(null, device)
        );
        stopDeviceScanSubject.pipe(take(1)).subscribe(() => {
            scanErrorSubscription.unsubscribe();
            scanFoundSubscription.unsubscribe();
        });
    }
);
const stopDeviceScanSubject = new Subject<void>();
let stopDeviceScanError: BleError | undefined;
const stopDeviceScan = jest.fn(() => {
    if (stopDeviceScanError != null) {
        throw stopDeviceScanError;
    }
    stopDeviceScanSubject.next();
});
const BleManagerMock = jest.fn<BleManager, any>(
    (): BleManager => ({
        destroy: jest.fn(),
        setLogLevel: jest.fn(),
        logLevel: jest.fn(),
        cancelTransaction: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        state: jest.fn(),
        onStateChange: jest.fn(),
        startDeviceScan: startDeviceScan,
        stopDeviceScan: stopDeviceScan,
        requestConnectionPriorityForDevice: jest.fn(),
        readRSSIForDevice: jest.fn(),
        requestMTUForDevice: jest.fn(),
        devices: jest.fn(),
        connectedDevices: jest.fn(),
        connectToDevice: jest.fn(),
        cancelDeviceConnection: jest.fn(),
        onDeviceDisconnected: jest.fn(),
        isDeviceConnected: jest.fn(),
        discoverAllServicesAndCharacteristicsForDevice: jest.fn(),
        servicesForDevice: jest.fn(),
        characteristicsForDevice: jest.fn(),
        descriptorsForDevice: jest.fn(),
        readCharacteristicForDevice: jest.fn(),
        writeCharacteristicWithResponseForDevice: jest.fn(),
        writeCharacteristicWithoutResponseForDevice: jest.fn(),
        monitorCharacteristicForDevice: jest.fn(),
        readDescriptorForDevice: jest.fn(),
        writeDescriptorForDevice: jest.fn()
    })
);
const bleManagerMock = new BleManagerMock();
const fullUuidMock = jest.fn((uuid: UUID) => uuid.toLowerCase());
let reactNativeBlePlxAdapter: ReactNativeBlePlxAdapter;
type DeviceMockParams = [NativeDevice];
const DeviceMock = jest.fn<Device, DeviceMockParams>(
    (nativeDevice: NativeDevice): Device => ({
        id: nativeDevice.id,
        name: nativeDevice.name,
        rssi: nativeDevice.rssi,
        mtu: nativeDevice.mtu,
        manufacturerData: nativeDevice.manufacturerData,
        serviceData: nativeDevice.serviceData,
        serviceUUIDs: nativeDevice.serviceUUIDs,
        localName: nativeDevice.localName,
        txPowerLevel: nativeDevice.txPowerLevel,
        solicitedServiceUUIDs: nativeDevice.solicitedServiceUUIDs,
        isConnectable: nativeDevice.isConnectable,
        overflowServiceUUIDs: nativeDevice.overflowServiceUUIDs,
        requestConnectionPriority: jest.fn(),
        readRSSI: jest.fn(),
        requestMTU: jest.fn(),
        connect: jest.fn(),
        cancelConnection: jest.fn(),
        isConnected: jest.fn(),
        onDisconnected: jest.fn(),
        discoverAllServicesAndCharacteristics: jest.fn(),
        services: jest.fn(),
        characteristicsForService: jest.fn(),
        descriptorsForService: jest.fn(),
        readCharacteristicForService: jest.fn(),
        writeCharacteristicWithResponseForService: jest.fn(),
        writeCharacteristicWithoutResponseForService: jest.fn(),
        monitorCharacteristicForService: jest.fn(),
        readDescriptorForService: jest.fn(),
        writeDescriptorForService: jest.fn()
    })
);
type RnBlePlxCharacteristicParams = [NativeCharacteristic];
const RnBlePlxCharacteristicMock = jest.fn<
    RnBlePlxCharacteristic,
    RnBlePlxCharacteristicParams
>(
    (nativeCharacteristic: NativeCharacteristic): RnBlePlxCharacteristic => ({
        id: nativeCharacteristic.id,
        uuid: nativeCharacteristic.uuid,
        serviceID: nativeCharacteristic.serviceID,
        serviceUUID: nativeCharacteristic.serviceUUID,
        deviceID: nativeCharacteristic.deviceID,
        isReadable: nativeCharacteristic.isReadable,
        isWritableWithResponse: nativeCharacteristic.isWritableWithResponse,
        isWritableWithoutResponse:
            nativeCharacteristic.isWritableWithoutResponse,
        isNotifiable: nativeCharacteristic.isNotifiable,
        isNotifying: nativeCharacteristic.isNotifying,
        isIndicatable: nativeCharacteristic.isIndicatable,
        value: nativeCharacteristic.value,
        descriptors: jest.fn(),
        read: jest.fn(),
        writeWithResponse: jest.fn(),
        writeWithoutResponse: jest.fn(),
        monitor: jest.fn(),
        readDescriptor: jest.fn(),
        writeDescriptor: jest.fn()
    })
);

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    reactNativeBlePlxAdapter = new ReactNativeBlePlxAdapter(
        bleManagerMock,
        fullUuidMock
    );
});

test("Successfully enable Bluetooth.", async () => {
    expect.assertions(2);
    (bleManagerMock.enable as jest.Mock).mockResolvedValueOnce(bleManagerMock);
    await expect(
        reactNativeBlePlxAdapter.enableBluetooth()
    ).resolves.toBeUndefined();
    expect(bleManagerMock.enable).toBeCalledTimes(1);
});

test("Fail to enable Bluetooth.", async () => {
    const error = Error("Failed to enable Bluetooth.");
    (bleManagerMock.enable as jest.Mock).mockRejectedValueOnce(error);
    expect.assertions(2);
    await expect(reactNativeBlePlxAdapter.enableBluetooth()).rejects.toBe(
        error
    );
    expect(bleManagerMock.enable).toBeCalledTimes(1);
});

const deviceUuids: string[] = [];
const scanMode = ScanMode.LowLatency;

test("Successfully start Bluetooth scan.", async () => {
    expect.assertions(3);
    const startScanPromise = reactNativeBlePlxAdapter
        .startScan(deviceUuids, undefined, scanMode)
        .toPromise();
    // Must stop scan in order for the "startScan" observable to complete.
    reactNativeBlePlxAdapter.stopScan();
    await expect(startScanPromise).resolves.toBeUndefined();
    expect(bleManagerMock.startDeviceScan).toBeCalledTimes(1);
    const options: ScanOptions = {
        scanMode: scanMode as number
    };
    expect(bleManagerMock.startDeviceScan).toBeCalledWith(
        deviceUuids,
        options,
        expect.any(Function)
    );
});

test(
    "Successfully stop Bluetooth scan after timeout.",
    fakeSchedulers(async advance => {
        jest.useFakeTimers("modern");
        expect.assertions(4);
        const timeout = 500 as Millisecond;
        const startScanPromise = reactNativeBlePlxAdapter
            .startScan(deviceUuids, timeout)
            .toPromise();
        advance(timeout);
        await expect(startScanPromise).resolves.toBeUndefined();
        expect(bleManagerMock.startDeviceScan).toBeCalledTimes(1);
        const options: ScanOptions = {
            scanMode: 1
        };
        expect(bleManagerMock.startDeviceScan).toBeCalledWith(
            deviceUuids,
            options,
            expect.any(Function)
        );
        expect(bleManagerMock.stopDeviceScan).toBeCalledTimes(1);
    })
);

test("Fail to start Bluetooth scan again before first completes.", async () => {
    expect.assertions(2);
    const startScanPromise01 = reactNativeBlePlxAdapter
        .startScan(deviceUuids, undefined, scanMode)
        .toPromise();
    const startScanPromise02 = reactNativeBlePlxAdapter
        .startScan(deviceUuids, undefined, scanMode)
        .toPromise();
    const error = new BluetoothError(BluetoothErrorType.ScanAlreadyStarted);
    await expect(startScanPromise02).rejects.toThrow(error);
    reactNativeBlePlxAdapter.stopScan();
    await expect(startScanPromise01).resolves.toBeUndefined();
});

test("Fail to start Bluetooth scan.", async () => {
    expect.assertions(2);
    const error = Error("Failed to start Bluetooth scan.") as BleError;
    const startScanPromise = reactNativeBlePlxAdapter
        .startScan(deviceUuids)
        .toPromise();
    deviceScanErrorSubject.next(error);
    await expect(startScanPromise).rejects.toThrow(error);
    expect(bleManagerMock.startDeviceScan).toBeCalledTimes(1);
});

const bluetoothDeviceId = uuidV4();
const foundNativeDevice: NativeDevice = {
    id: bluetoothDeviceId,
    name: null,
    rssi: null,
    mtu: 23,
    manufacturerData: null,
    serviceData: null,
    serviceUUIDs: null,
    localName: null,
    txPowerLevel: null,
    solicitedServiceUUIDs: null,
    isConnectable: null,
    overflowServiceUUIDs: null
};
const foundDevice = new DeviceMock(foundNativeDevice);

test("Successfully receive detected device.", async () => {
    expect.assertions(1);
    const foundPeripheral: Peripheral = {
        advertising: {
            isConnectable: undefined,
            manufacturerData: Buffer.alloc(0),
            serviceData: {},
            serviceUuids: [],
            txPowerLevel: undefined
        },
        id: bluetoothDeviceId as PeripheralId,
        name: "",
        rssi: undefined
    };
    const startScanPromise = reactNativeBlePlxAdapter
        .startScan(deviceUuids)
        .pipe(take(1))
        .toPromise();
    deviceScanFoundSubject.next(foundDevice);
    await expect(startScanPromise).resolves.toStrictEqual(foundPeripheral);
});

test("Successfully stop Bluetooth scan.", async () => {
    expect.assertions(2);
    reactNativeBlePlxAdapter.startScan(deviceUuids);
    await expect(reactNativeBlePlxAdapter.stopScan()).resolves.toBeUndefined();
    expect(bleManagerMock.stopDeviceScan).toBeCalledTimes(1);
});

test("Fail to stop Bluetooth scan.", async () => {
    expect.assertions(2);
    reactNativeBlePlxAdapter.startScan(deviceUuids);
    const error = Error("Failed to stop Bluetooth scan.") as BleError;
    stopDeviceScanError = error;
    await expect(reactNativeBlePlxAdapter.stopScan()).rejects.toBe(error);
    expect(bleManagerMock.stopDeviceScan).toBeCalledTimes(1);
    stopDeviceScanError = undefined;
});

(bleManagerMock.connectToDevice as jest.Mock).mockResolvedValue(foundDevice);
(foundDevice.discoverAllServicesAndCharacteristics as jest.Mock).mockResolvedValue(
    foundDevice
);
const peripheralId = bluetoothDeviceId as PeripheralId;

test("Successfully connect to Bluetooth device.", async () => {
    expect.assertions(4);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .pipe(take(1))
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    const options: ConnectionOptions = {
        timeout: 30000
    };
    expect(bleManagerMock.connectToDevice).toBeCalledWith(
        peripheralId,
        options
    );
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
});

test("Fail to connect to Bluetooth device.", async () => {
    expect.assertions(3);
    const error = Error("Failed to connect to device.") as BleError;
    (bleManagerMock.connectToDevice as jest.Mock).mockRejectedValueOnce(error);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
    await expect(connectPromise).rejects.toThrow(error);
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    const options: ConnectionOptions = {
        timeout: 30000
    };
    expect(bleManagerMock.connectToDevice).toBeCalledWith(
        peripheralId,
        options
    );
});

test(
    "Fail to connect to Bluetooth device after timeout.",
    fakeSchedulers(async advance => {
        jest.useFakeTimers("modern");
        expect.assertions(3);
        const error = Error(
            "Failed to connect to device before timeout."
        ) as BleError;
        type ConnectToDeviceParams = [string, ConnectionOptions | undefined];
        (bleManagerMock.connectToDevice as jest.Mock<
            Promise<Device>,
            ConnectToDeviceParams
        >).mockImplementationOnce((_, options) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(error);
                }, options?.timeout);
            });
        });
        const timeout = 60000 as Millisecond;
        const connectPromise = reactNativeBlePlxAdapter
            .connect(peripheralId, timeout)
            .toPromise();
        advance(60000);
        await expect(connectPromise).rejects.toThrow(error);
        expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
        const options: ConnectionOptions = {
            timeout: timeout
        };
        expect(bleManagerMock.connectToDevice).toBeCalledWith(
            peripheralId,
            options
        );
    })
);

const deviceDisconnectedErrorSubject = new Subject<BleError>();
const deviceDisconnectedSubject = new Subject<Device>();
let errorSubscription: SubscriptionLike | undefined;
let disconnectedSubscription: SubscriptionLike | undefined;
const subscription: Subscription = {
    remove: jest.fn(() => {
        errorSubscription?.unsubscribe();
        errorSubscription = undefined;
        disconnectedSubscription?.unsubscribe();
        disconnectedSubscription = undefined;
    })
};
(bleManagerMock.onDeviceDisconnected as jest.Mock).mockImplementation(
    (
        deviceIdentifier: DeviceId,
        listener: (error: BleError | null, device: Device | null) => void
    ) => {
        errorSubscription = deviceDisconnectedErrorSubject.subscribe(error => {
            listener(error, null);
        });
        disconnectedSubscription = deviceDisconnectedSubject.subscribe(
            device => {
                listener(null, device);
            }
        );
        return subscription;
    }
);

test("Bluetooth device disconnects from error.", async () => {
    expect.assertions(4);
    const error = Error("Connection lost unexpectedly.") as BleError;
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
    deviceDisconnectedErrorSubject.next(error);
    await expect(connectPromise).rejects.toBe(error);
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
    expect(subscription.remove).toBeCalledTimes(1);
});

test("Successfully disconnect from Bluetooth device.", async () => {
    expect.assertions(6);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
    (bleManagerMock.cancelDeviceConnection as jest.Mock).mockImplementationOnce(
        () => {
            deviceDisconnectedSubject.next(foundDevice);
            return Promise.resolve(foundDevice);
        }
    );
    const disconnectPromise = reactNativeBlePlxAdapter.disconnect(peripheralId);
    const allPromises = Promise.all([connectPromise, disconnectPromise]);
    await expect(allPromises).resolves.toStrictEqual([undefined, undefined]);
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledTimes(1);
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledWith(
        bluetoothDeviceId
    );
    expect(subscription.remove).toBeCalledTimes(1);
});

test("Fail to disconnect from Bluetooth device.", async () => {
    expect.assertions(6);
    const connectSubscription = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .subscribe();
    const error = new Error("Failed to disconnect from device.") as BleError;
    (bleManagerMock.cancelDeviceConnection as jest.Mock<
        Promise<Device>,
        [string]
    >).mockRejectedValueOnce(error);
    const disconnectPromise = reactNativeBlePlxAdapter.disconnect(peripheralId);
    await expect(disconnectPromise).rejects.toBe(error);
    expect(connectSubscription.closed).toBeFalsy();
    connectSubscription.unsubscribe();
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledTimes(1);
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledWith(
        bluetoothDeviceId
    );
});

class BatteryLevel extends HexCharacteristic
    implements ReadableCharacteristic<Hexadecimal> {
    readonly byteLength = 1;
    readonly serviceUuid = "0000180A-0000-1000-8000-00805F9B34FB";
    readonly uuid = "00002A19-0000-1000-8000-00805F9B34FB";
}

test("Successfully read hex from Bluetooth device.", async () => {
    expect.assertions(4);
    const rawReadValue = "Qw==";
    const nativeCharacteristic: NativeCharacteristic = {
        id: 0,
        uuid: "00002a19-0000-1000-8000-00805f9b34fb",
        serviceID: 0,
        serviceUUID: "0000180a-0000-1000-8000-00805f9b34fb",
        deviceID: bluetoothDeviceId,
        isReadable: true,
        isWritableWithResponse: false,
        isWritableWithoutResponse: false,
        isNotifiable: false,
        isNotifying: false,
        isIndicatable: false,
        value: rawReadValue
    };
    const readCharacteristic = new RnBlePlxCharacteristicMock(
        nativeCharacteristic
    );
    (bleManagerMock.readCharacteristicForDevice as jest.Mock).mockResolvedValueOnce(
        readCharacteristic
    );
    const characteristic = new BatteryLevel();
    const readValue = Hexadecimal.fromString("43");
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).resolves.toStrictEqual(readValue);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledTimes(1);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledWith(
        bluetoothDeviceId,
        nativeCharacteristic.serviceUUID,
        nativeCharacteristic.uuid
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

class ManufacturerName extends UTF8Characteristic
    implements ReadableCharacteristic<string>, WritableCharacteristic<string> {
    readonly byteLength = 11;
    readonly serviceUuid = "0000180A-0000-1000-8000-00805F9B34FB";
    readonly uuid = "00002A29-0000-1000-8000-00805F9B34FB";
    readonly withResponse = false;
}
const rawReadValue = "aW5mb3JtdQ==";
const nativeCharacteristic: NativeCharacteristic = {
    id: 1,
    uuid: "00002a29-0000-1000-8000-00805f9b34fb",
    serviceID: 0,
    serviceUUID: "0000180a-0000-1000-8000-00805f9b34fb",
    deviceID: bluetoothDeviceId,
    isReadable: true,
    isWritableWithResponse: false,
    isWritableWithoutResponse: false,
    isNotifiable: false,
    isNotifying: false,
    isIndicatable: false,
    value: rawReadValue
};

test("Successfully read string from Bluetooth device.", async () => {
    expect.assertions(4);
    const readCharacteristic = new RnBlePlxCharacteristicMock(
        nativeCharacteristic
    );
    (bleManagerMock.readCharacteristicForDevice as jest.Mock).mockResolvedValueOnce(
        readCharacteristic
    );
    const characteristic = new ManufacturerName();
    const readValue = "informu";
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).resolves.toStrictEqual(readValue);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledTimes(1);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledWith(
        bluetoothDeviceId,
        nativeCharacteristic.serviceUUID,
        nativeCharacteristic.uuid
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Fail to read string from Bluetooth device.", async () => {
    expect.assertions(4);
    const readError = Error("Failed to read characteristic.") as BleError;
    (bleManagerMock.readCharacteristicForDevice as jest.Mock).mockRejectedValueOnce(
        readError
    );
    const characteristic = new ManufacturerName();
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).rejects.toBe(readError);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledTimes(1);
    expect(bleManagerMock.readCharacteristicForDevice).toBeCalledWith(
        bluetoothDeviceId,
        nativeCharacteristic.serviceUUID,
        nativeCharacteristic.uuid
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

class TxPower extends HexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly byteLength = 1;
    readonly serviceUuid = "a173424a-9708-4c4c-aeed-0ab1af539797";
    readonly uuid = "ac9b44ea-aa5e-40f4-888a-c2637573ab04";
    readonly withResponse = true;
}

test("Successfully write hex (with response) to Bluetooth device.", async () => {
    expect.assertions(4);
    const characteristic = new TxPower();
    const writeValue = Hexadecimal.fromString("01");
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).resolves.toBeUndefined();
    expect(
        bleManagerMock.writeCharacteristicWithResponseForDevice
    ).toBeCalledTimes(1);
    const base64WriteValue = "AQ==";
    expect(
        bleManagerMock.writeCharacteristicWithResponseForDevice
    ).toBeCalledWith(
        bluetoothDeviceId,
        characteristic.serviceUuid,
        characteristic.uuid,
        base64WriteValue
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Successfully write string (without response) to Bluetooth device.", async () => {
    expect.assertions(4);
    const characteristic = new ManufacturerName();
    const writeValue = "informu";
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).resolves.toBeUndefined();
    expect(
        bleManagerMock.writeCharacteristicWithoutResponseForDevice
    ).toBeCalledTimes(1);
    const base64WriteValue = "aW5mb3JtdQ==";
    expect(
        bleManagerMock.writeCharacteristicWithoutResponseForDevice
    ).toBeCalledWith(
        bluetoothDeviceId,
        characteristic.serviceUuid.toLowerCase(),
        characteristic.uuid.toLowerCase(),
        base64WriteValue
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

const writeError = Error("Failed to write to characteristic.") as BleError;

test("Fails to write hex (with response) to Bluetooth device.", async () => {
    expect.assertions(4);
    (bleManagerMock.writeCharacteristicWithResponseForDevice as jest.Mock).mockRejectedValueOnce(
        writeError
    );
    const characteristic = new TxPower();
    const writeValue = Hexadecimal.fromString("01");
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).rejects.toBe(writeError);
    expect(
        bleManagerMock.writeCharacteristicWithResponseForDevice
    ).toBeCalledTimes(1);
    const base64WriteValue = "AQ==";
    expect(
        bleManagerMock.writeCharacteristicWithResponseForDevice
    ).toBeCalledWith(
        bluetoothDeviceId,
        characteristic.serviceUuid,
        characteristic.uuid,
        base64WriteValue
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Fails to write string (without response) to Bluetooth device.", async () => {
    expect.assertions(4);
    (bleManagerMock.writeCharacteristicWithoutResponseForDevice as jest.Mock).mockRejectedValueOnce(
        writeError
    );
    const characteristic = new ManufacturerName();
    const writeValue = "informu";
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).rejects.toBe(writeError);
    expect(
        bleManagerMock.writeCharacteristicWithoutResponseForDevice
    ).toBeCalledTimes(1);
    const base64WriteValue = "aW5mb3JtdQ==";
    expect(
        bleManagerMock.writeCharacteristicWithoutResponseForDevice
    ).toBeCalledWith(
        bluetoothDeviceId,
        characteristic.serviceUuid.toLowerCase(),
        characteristic.uuid.toLowerCase(),
        base64WriteValue
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});
