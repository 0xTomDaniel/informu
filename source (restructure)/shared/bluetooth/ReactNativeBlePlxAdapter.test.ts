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
    BluetoothError
} from "./BluetoothPort";
import { take, tap } from "rxjs/operators";
import { Buffer } from "buffer";
import {
    HexCharacteristic,
    ReadableCharacteristic,
    UTF8Characteristic,
    WritableCharacteristic
} from "./Characteristic";
import Hexadecimal from "../metaLanguage/Hexadecimal";
import { fakeSchedulers } from "rxjs-marbles/jest";
import { Platform } from "react-native";

const cancelDeviceConnectionMock = jest.fn<Promise<Device>, [string]>();
const connectToDeviceMock = jest.fn<
    Promise<Device>,
    [string, ConnectionOptions | undefined]
>();
enum State {
    Unknown = "Unknown",
    Resetting = "Resetting",
    Unsupported = "Unsupported",
    Unauthorized = "Unauthorized",
    PoweredOff = "PoweredOff",
    PoweredOn = "PoweredOn"
}
let state = State.PoweredOn;
// The actual behavior of enable never resolves if state is already "PoweredOn".
const enableMock = jest.fn<Promise<BleManager>, [(string | undefined)?]>(
    (_?: string | undefined) => {
        return new Promise(resolve => {
            if (state !== State.PoweredOn) {
                state = State.PoweredOn;
                const bleManager = {} as BleManager;
                resolve(bleManager);
            }
        });
    }
);
const onDeviceDisconnectedMock = jest.fn<
    Subscription,
    [DeviceId, (error: BleError | null, device: Device | null) => void]
>();
const readCharacteristicForDeviceMock = jest.fn<
    Promise<RnBlePlxCharacteristic>,
    [string, string, string, (string | undefined)?]
>();
const onStartDeviceScan = new Subject<void>();
const deviceScanErrorSubject = new Subject<BleError | null>();
const deviceScanFoundSubject = new Subject<Device | null>();
const startDeviceScanMock = jest.fn(
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
        onStartDeviceScan.next();
    }
);
const stateMock = jest.fn(() => Promise.resolve(state));
const stopDeviceScanSubject = new Subject<void>();
let stopDeviceScanError: BleError | undefined;
const stopDeviceScanMock = jest.fn(() => {
    if (stopDeviceScanError != null) {
        throw stopDeviceScanError;
    }
    stopDeviceScanSubject.next();
});
const BleManagerMock = jest.fn(
    (): BleManager => ({
        destroy: jest.fn(),
        setLogLevel: jest.fn(),
        logLevel: jest.fn(),
        cancelTransaction: jest.fn(),
        enable: enableMock,
        disable: jest.fn(),
        state: stateMock,
        onStateChange: jest.fn(),
        startDeviceScan: startDeviceScanMock,
        stopDeviceScan: stopDeviceScanMock,
        requestConnectionPriorityForDevice: jest.fn(),
        readRSSIForDevice: jest.fn(),
        requestMTUForDevice: jest.fn(),
        devices: jest.fn(),
        connectedDevices: jest.fn(),
        connectToDevice: connectToDeviceMock,
        cancelDeviceConnection: cancelDeviceConnectionMock,
        onDeviceDisconnected: onDeviceDisconnectedMock,
        isDeviceConnected: jest.fn(),
        discoverAllServicesAndCharacteristicsForDevice: jest.fn(),
        servicesForDevice: jest.fn(),
        characteristicsForDevice: jest.fn(),
        descriptorsForDevice: jest.fn(),
        readCharacteristicForDevice: readCharacteristicForDeviceMock,
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
const DeviceMock = jest.fn(
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
const RnBlePlxCharacteristicMock = jest.fn(
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
const PlatformMock: typeof Platform = {
    OS: "android",
    isTV: false,
    Version: 0,
    select: jest.fn()
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    reactNativeBlePlxAdapter = new ReactNativeBlePlxAdapter(
        bleManagerMock,
        fullUuidMock,
        PlatformMock
    );
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
        expect.assertions(4);
        jest.useFakeTimers("modern");
        const timeout = 5000 as Millisecond;
        onStartDeviceScan
            .pipe(take(1))
            .toPromise()
            .then(() => {
                advance(timeout);
            });
        const startScanPromise = reactNativeBlePlxAdapter
            .startScan(deviceUuids, timeout)
            .toPromise();
        await expect(startScanPromise).rejects.toStrictEqual(
            BluetoothError.ScanTimeout
        );
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
    const error = BluetoothError.ScanAlreadyStarted;
    await expect(startScanPromise02).rejects.toThrow(error);
    reactNativeBlePlxAdapter.stopScan();
    await expect(startScanPromise01).resolves.toBeUndefined();
});

test("Fail to start Bluetooth scan.", async () => {
    expect.assertions(2);
    const blePlxError = Error(
        "Failed to start Bluetooth device scanning."
    ) as BleError;
    onStartDeviceScan
        .pipe(take(1))
        .toPromise()
        .then(() => {
            deviceScanErrorSubject.next(blePlxError);
        });
    const startScanPromise = reactNativeBlePlxAdapter
        .startScan(deviceUuids)
        .toPromise();
    const bluetoothError = BluetoothError.FailedToStartScan(blePlxError);
    await expect(startScanPromise).rejects.toStrictEqual(bluetoothError);
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
    onStartDeviceScan
        .pipe(take(1))
        .toPromise()
        .then(() => {
            deviceScanFoundSubject.next(foundDevice);
        });
    const startScanPromise = reactNativeBlePlxAdapter
        .startScan(deviceUuids)
        .pipe(take(1))
        .toPromise();
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
    const blePlxError = Error("Failed to stop Bluetooth scan.") as BleError;
    stopDeviceScanError = blePlxError;
    const bluetoothError = BluetoothError.FailedToStopScan(blePlxError);
    await expect(reactNativeBlePlxAdapter.stopScan()).rejects.toStrictEqual(
        bluetoothError
    );
    expect(bleManagerMock.stopDeviceScan).toBeCalledTimes(1);
    stopDeviceScanError = undefined;
});

connectToDeviceMock.mockResolvedValue(foundDevice);
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
    expect(connectToDeviceMock).toBeCalledTimes(1);
    const options: ConnectionOptions = {
        timeout: 10000
    };
    expect(connectToDeviceMock).toBeCalledWith(peripheralId, options);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
});

test("Fail to connect to Bluetooth device.", async () => {
    expect.assertions(3);
    const blePlxError = Error("Failed to connect to device.") as BleError;
    connectToDeviceMock.mockRejectedValueOnce(blePlxError);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
    const bluetoothError = BluetoothError.FailedToConnect(
        peripheralId,
        blePlxError
    );
    await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
    expect(connectToDeviceMock).toBeCalledTimes(1);
    const options: ConnectionOptions = {
        timeout: 10000
    };
    expect(connectToDeviceMock).toBeCalledWith(peripheralId, options);
});

test(
    "Fail to connect to Bluetooth device after timeout.",
    fakeSchedulers(async advance => {
        jest.useFakeTimers("modern");
        expect.assertions(3);
        const bleError = Error(
            "Failed to connect to device before timeout."
        ) as BleError;
        connectToDeviceMock.mockImplementationOnce((_, options) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(bleError);
                }, options?.timeout);
                advance(60000);
            });
        });
        const timeout = 60000 as Millisecond;
        const connectPromise = reactNativeBlePlxAdapter
            .connect(peripheralId, timeout)
            .toPromise();
        const bluetoothError = BluetoothError.FailedToConnect(
            peripheralId,
            bleError
        );
        await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
        expect(connectToDeviceMock).toBeCalledTimes(1);
        const options: ConnectionOptions = {
            timeout: timeout
        };
        expect(connectToDeviceMock).toBeCalledWith(peripheralId, options);
    })
);

const deviceDisconnectedErrorSubject = new Subject<BleError>();
const deviceDisconnectedSubject = new Subject<Device>();
let errorSubscription: SubscriptionLike | undefined;
let disconnectedSubscription: SubscriptionLike | undefined;
const deviceDisconnectedSubscription: Subscription = {
    remove: jest.fn(() => {
        errorSubscription?.unsubscribe();
        errorSubscription = undefined;
        disconnectedSubscription?.unsubscribe();
        disconnectedSubscription = undefined;
    })
};
onDeviceDisconnectedMock.mockImplementation(
    (
        _: DeviceId,
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
        return deviceDisconnectedSubscription;
    }
);

test("Bluetooth device disconnects from error.", async () => {
    expect.assertions(4);
    const blePlxError = Error("Connection lost unexpectedly.") as BleError;
    connectToDeviceMock.mockImplementationOnce(() => {
        deviceDisconnectedErrorSubject.next(blePlxError);
        return Promise.resolve(foundDevice);
    });
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
    const bluetoothError = BluetoothError.ConnectionLostUnexpectedly(
        peripheralId,
        blePlxError
    );
    await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
    expect(connectToDeviceMock).toBeCalledTimes(1);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
    expect(deviceDisconnectedSubscription.remove).toBeCalledTimes(1);
});

test("Successfully disconnect from Bluetooth device.", async () => {
    expect.assertions(6);
    cancelDeviceConnectionMock.mockImplementationOnce(() => {
        deviceDisconnectedSubject.next(foundDevice);
        return Promise.resolve(foundDevice);
    });
    const disconnectSubject = new Subject<void>();
    const disconnectPromise = disconnectSubject.toPromise();
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .pipe(
            tap(() =>
                reactNativeBlePlxAdapter
                    .disconnect(peripheralId)
                    .then(() => disconnectSubject.complete())
                    .catch(e => disconnectSubject.error(e))
            )
        )
        .toPromise();
    const allPromises = Promise.all([connectPromise, disconnectPromise]);
    await expect(allPromises).resolves.toStrictEqual([undefined, undefined]);
    expect(connectToDeviceMock).toBeCalledTimes(1);
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledTimes(1);
    expect(bleManagerMock.cancelDeviceConnection).toBeCalledWith(
        bluetoothDeviceId
    );
    expect(deviceDisconnectedSubscription.remove).toBeCalledTimes(1);
});

test("Fail to disconnect from Bluetooth device.", async () => {
    expect.assertions(6);
    const blePlxError = new Error(
        "Failed to disconnect from device."
    ) as BleError;
    cancelDeviceConnectionMock.mockRejectedValueOnce(blePlxError);
    const disconnectSubject = new Subject<void>();
    const disconnectPromise = disconnectSubject.toPromise();
    const connectSubscription = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .pipe(
            tap(() =>
                reactNativeBlePlxAdapter
                    .disconnect(peripheralId)
                    .then(() => disconnectSubject.complete())
                    .catch(e => disconnectSubject.error(e))
            )
        )
        .subscribe();
    const bluetoothError = BluetoothError.FailedToDisconnect(
        peripheralId,
        blePlxError
    );
    await expect(disconnectPromise).rejects.toStrictEqual(bluetoothError);
    expect(connectSubscription.closed).toBeFalsy();
    connectSubscription.unsubscribe();
    expect(connectToDeviceMock).toBeCalledTimes(1);
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
    readCharacteristicForDeviceMock.mockResolvedValueOnce(readCharacteristic);
    const characteristic = new BatteryLevel();
    const readValue = Hexadecimal.fromString("43");
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).resolves.toStrictEqual(readValue);
    expect(readCharacteristicForDeviceMock).toBeCalledTimes(1);
    expect(readCharacteristicForDeviceMock).toBeCalledWith(
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
    readCharacteristicForDeviceMock.mockResolvedValueOnce(readCharacteristic);
    const characteristic = new ManufacturerName();
    const readValue = "informu";
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).resolves.toStrictEqual(readValue);
    expect(readCharacteristicForDeviceMock).toBeCalledTimes(1);
    expect(readCharacteristicForDeviceMock).toBeCalledWith(
        bluetoothDeviceId,
        nativeCharacteristic.serviceUUID,
        nativeCharacteristic.uuid
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Fail to read string from Bluetooth device.", async () => {
    expect.assertions(4);
    const blePlxError = Error("Failed to read characteristic.") as BleError;
    readCharacteristicForDeviceMock.mockRejectedValueOnce(blePlxError);
    const characteristic = new ManufacturerName();
    const bluetoothError = BluetoothError.FailedToRead(
        characteristic.uuid,
        peripheralId,
        blePlxError
    );
    await expect(
        reactNativeBlePlxAdapter.read(peripheralId, characteristic)
    ).rejects.toStrictEqual(bluetoothError);
    expect(readCharacteristicForDeviceMock).toBeCalledTimes(1);
    expect(readCharacteristicForDeviceMock).toBeCalledWith(
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
        base64WriteValue,
        undefined
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
        base64WriteValue,
        undefined
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

const blePlxError = Error("Failed to write to characteristic.") as BleError;

test("Fails to write hex (with response) to Bluetooth device.", async () => {
    expect.assertions(4);
    (bleManagerMock.writeCharacteristicWithResponseForDevice as jest.Mock).mockRejectedValueOnce(
        blePlxError
    );
    const characteristic = new TxPower();
    const writeValue = Hexadecimal.fromString("01");
    const bluetoothError = BluetoothError.FailedToWrite(
        writeValue.toString(),
        characteristic.uuid,
        peripheralId,
        blePlxError
    );
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).rejects.toStrictEqual(bluetoothError);
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
        base64WriteValue,
        undefined
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Fails to write string (without response) to Bluetooth device.", async () => {
    expect.assertions(4);
    (bleManagerMock.writeCharacteristicWithoutResponseForDevice as jest.Mock).mockRejectedValueOnce(
        blePlxError
    );
    const characteristic = new ManufacturerName();
    const writeValue = "informu";
    const bluetoothError = BluetoothError.FailedToWrite(
        writeValue.toString(),
        characteristic.uuid,
        peripheralId,
        blePlxError
    );
    await expect(
        reactNativeBlePlxAdapter.write(peripheralId, characteristic, writeValue)
    ).rejects.toStrictEqual(bluetoothError);
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
        base64WriteValue,
        undefined
    );
    expect(fullUuidMock).toBeCalledTimes(2);
});

test("Given that bluetooth is disabled and the device is Android, then successfully enable Bluetooth when any public method is called (excluding 'disconnect' and 'stopScan').", async () => {
    expect.assertions(12);
    connectToDeviceMock.mockResolvedValueOnce(foundDevice);
    onDeviceDisconnectedMock.mockImplementation(
        (
            _: DeviceId,
            listener: (error: BleError | null, device: Device | null) => void
        ) => {
            listener(null, foundDevice);
            return {
                remove: jest.fn()
            };
        }
    );
    state = State.PoweredOff;
    const connectPromise = reactNativeBlePlxAdapter
        .connect(uuidV4() as PeripheralId)
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
    expect(enableMock).toBeCalledTimes(1);
    expect(state).toBe(State.PoweredOn);
    state = State.PoweredOff;
    const readCharacteristic = new RnBlePlxCharacteristicMock(
        nativeCharacteristic
    );
    readCharacteristicForDeviceMock.mockResolvedValueOnce(readCharacteristic);
    const characteristic01 = new BatteryLevel();
    const readPromise = reactNativeBlePlxAdapter.read(
        peripheralId,
        characteristic01
    );
    await expect(readPromise).resolves.toBeDefined();
    expect(enableMock).toBeCalledTimes(2);
    expect(state).toBe(State.PoweredOn);
    state = State.PoweredOff;
    const startScanPromise = reactNativeBlePlxAdapter.startScan([]).toPromise();
    await reactNativeBlePlxAdapter.stopScan();
    await expect(startScanPromise).resolves.toBeUndefined();
    expect(enableMock).toBeCalledTimes(3);
    expect(state).toBe(State.PoweredOn);
    state = State.PoweredOff;
    const characteristic02 = new ManufacturerName();
    const writeValue = "informu";
    const writePromise = reactNativeBlePlxAdapter.write(
        peripheralId,
        characteristic02,
        writeValue
    );
    await expect(writePromise).resolves.toBeUndefined();
    expect(enableMock).toBeCalledTimes(4);
    expect(state).toBe(State.PoweredOn);
});

test("Given that bluetooth is disabled and the device is Android, then fail to enable Bluetooth when any public method is called (excluding 'disconnect' and 'stopScan').", async () => {
    expect.assertions(4);
    const bleError = Error("Failed to enable Bluetooth.");
    state = State.PoweredOff;
    enableMock.mockRejectedValueOnce(bleError);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(uuidV4() as PeripheralId)
        .toPromise();
    const bluetoothError = BluetoothError.FailedToEnableBluetooth(bleError);
    await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic01 = new BatteryLevel();
    enableMock.mockRejectedValueOnce(bleError);
    const readPromise = reactNativeBlePlxAdapter.read(
        peripheralId,
        characteristic01
    );
    await expect(readPromise).rejects.toStrictEqual(bluetoothError);
    enableMock.mockRejectedValueOnce(bleError);
    const startScanPromise = reactNativeBlePlxAdapter.startScan([]).toPromise();
    await expect(startScanPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic02 = new ManufacturerName();
    const writeValue = "informu";
    enableMock.mockRejectedValueOnce(bleError);
    const writePromise = reactNativeBlePlxAdapter.write(
        peripheralId,
        characteristic02,
        writeValue
    );
    await expect(writePromise).rejects.toStrictEqual(bluetoothError);
});

test("Given that bluetooth is powered off and the device is iOS, then do not execute 'enable' and fail to execute any public method (excluding 'disconnect' and 'stopScan').", async () => {
    expect.assertions(5);
    const PlatformMockIOS: typeof Platform = {
        OS: "ios",
        isTV: false,
        isPad: false,
        isTVOS: false,
        Version: 0,
        select: jest.fn()
    };
    reactNativeBlePlxAdapter = new ReactNativeBlePlxAdapter(
        bleManagerMock,
        fullUuidMock,
        PlatformMockIOS
    );
    const bleError = Error("Bluetooth is powered off.");
    state = State.PoweredOff;
    enableMock.mockRejectedValueOnce(bleError);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(uuidV4() as PeripheralId)
        .toPromise();
    const bluetoothError = BluetoothError.BluetoothPoweredOff;
    await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic01 = new BatteryLevel();
    enableMock.mockRejectedValueOnce(bleError);
    const readPromise = reactNativeBlePlxAdapter.read(
        peripheralId,
        characteristic01
    );
    await expect(readPromise).rejects.toStrictEqual(bluetoothError);
    enableMock.mockRejectedValueOnce(bleError);
    const startScanPromise = reactNativeBlePlxAdapter.startScan([]).toPromise();
    await expect(startScanPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic02 = new ManufacturerName();
    const writeValue = "informu";
    enableMock.mockRejectedValueOnce(bleError);
    const writePromise = reactNativeBlePlxAdapter.write(
        peripheralId,
        characteristic02,
        writeValue
    );
    await expect(writePromise).rejects.toStrictEqual(bluetoothError);
    expect(enableMock).toBeCalledTimes(0);
});

test("Given that bluetooth is unauthorized and the device is iOS, then fail to execute any public method (excluding 'disconnect' and 'stopScan').", async () => {
    expect.assertions(5);
    const PlatformMockIOS: typeof Platform = {
        OS: "ios",
        isTV: false,
        isPad: false,
        isTVOS: false,
        Version: 0,
        select: jest.fn()
    };
    reactNativeBlePlxAdapter = new ReactNativeBlePlxAdapter(
        bleManagerMock,
        fullUuidMock,
        PlatformMockIOS
    );
    const bleError = Error("Bluetooth is powered off.");
    state = State.Unauthorized;
    enableMock.mockRejectedValueOnce(bleError);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(uuidV4() as PeripheralId)
        .toPromise();
    const bluetoothError = BluetoothError.BluetoothUnauthorized;
    await expect(connectPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic01 = new BatteryLevel();
    enableMock.mockRejectedValueOnce(bleError);
    const readPromise = reactNativeBlePlxAdapter.read(
        peripheralId,
        characteristic01
    );
    await expect(readPromise).rejects.toStrictEqual(bluetoothError);
    enableMock.mockRejectedValueOnce(bleError);
    const startScanPromise = reactNativeBlePlxAdapter.startScan([]).toPromise();
    await expect(startScanPromise).rejects.toStrictEqual(bluetoothError);
    const characteristic02 = new ManufacturerName();
    const writeValue = "informu";
    enableMock.mockRejectedValueOnce(bleError);
    const writePromise = reactNativeBlePlxAdapter.write(
        peripheralId,
        characteristic02,
        writeValue
    );
    await expect(writePromise).rejects.toStrictEqual(bluetoothError);
    expect(enableMock).toBeCalledTimes(0);
});
