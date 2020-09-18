import ReactNativeBlePlxAdapter from "./ReactNativeBlePlxAdapter";
import {
    BleManager,
    Device,
    BleError,
    ScanOptions,
    DeviceId,
    Base64,
    UUID,
    NativeDevice,
    ConnectionOptions,
    Subscription
} from "react-native-ble-plx";
import { Subject, SubscriptionLike } from "rxjs";
import { v4 as uuidV4 } from "uuid";
import { Millisecond } from "../metaLanguage/Types";
import { ScanMode, Peripheral, PeripheralId } from "./Bluetooth";
import { take } from "rxjs/operators";
import { Buffer } from "buffer";

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
const reactNativeBlePlxAdapter = new ReactNativeBlePlxAdapter(bleManagerMock);
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

beforeEach(() => {
    jest.clearAllMocks();
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

test("Successfully start Bluetooth scan.", async () => {
    expect.assertions(3);
    const deviceUuids: string[] = [];
    const timeout = 1000 as Millisecond;
    const scanMode = ScanMode.balanced;
    const startScanPromise = reactNativeBlePlxAdapter.startScan(
        deviceUuids,
        timeout,
        scanMode
    );
    // A non-error callback response from 'bleManager.startDeviceScan' is
    // required for 'reactNativeBlePlxAdapter.startScan' to resolve.
    deviceScanFoundSubject.next(null);
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

test("Fail to start Bluetooth scan.", async () => {
    expect.assertions(2);
    const deviceUuids: string[] = [];
    const timeout = 1000 as Millisecond;
    const error = Error("Failed to start Bluetooth scan.") as BleError;
    const startScanPromise = reactNativeBlePlxAdapter.startScan(
        deviceUuids,
        timeout
    );
    deviceScanErrorSubject.next(error);
    await expect(startScanPromise).rejects.toBe(error);
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

test("Successfully receives detected device.", async () => {
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
    const deviceUuids: string[] = [];
    const timeout = 1000 as Millisecond;
    const discoveredPeripheralPromise = reactNativeBlePlxAdapter.discoveredPeripheral
        .pipe(take(1))
        .toPromise();
    reactNativeBlePlxAdapter.startScan(deviceUuids, timeout);
    deviceScanFoundSubject.next(foundDevice);
    await expect(discoveredPeripheralPromise).resolves.toStrictEqual(
        foundPeripheral
    );
});

test("Successfully stop Bluetooth scan.", async () => {
    expect.assertions(2);
    await expect(reactNativeBlePlxAdapter.stopScan()).resolves.toBeUndefined();
    expect(bleManagerMock.stopDeviceScan).toBeCalledTimes(1);
});

test("Fail to stop Bluetooth scan.", async () => {
    expect.assertions(2);
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

test("Successfully connects to Bluetooth device.", async () => {
    expect.assertions(4);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .pipe(take(1))
        .toPromise();
    await expect(connectPromise).resolves.toBeUndefined();
    expect(bleManagerMock.connectToDevice).toBeCalledTimes(1);
    const options: ConnectionOptions = {
        timeout: 30
    };
    expect(bleManagerMock.connectToDevice).toBeCalledWith(
        peripheralId,
        options
    );
    expect(foundDevice.discoverAllServicesAndCharacteristics).toBeCalledTimes(
        1
    );
});

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

(bleManagerMock.cancelDeviceConnection as jest.Mock).mockImplementationOnce(
    () => {
        deviceDisconnectedSubject.next(foundDevice);
        return Promise.resolve(foundDevice);
    }
);

test("Successfully disconnects from Bluetooth device.", async () => {
    expect.assertions(6);
    const connectPromise = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .toPromise();
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

const error = Error("Failed to disconnect from Bluetooth device.") as BleError;
(bleManagerMock.cancelDeviceConnection as jest.Mock).mockImplementationOnce(
    () => {
        return Promise.reject(error);
    }
);

test("Fails to disconnect from Bluetooth device.", async () => {
    expect.assertions(6);
    const connectSubscription = reactNativeBlePlxAdapter
        .connect(peripheralId)
        .subscribe();
    const disconnectPromise = reactNativeBlePlxAdapter.disconnect(peripheralId);
    await expect(disconnectPromise).rejects.toBe(error);
    connectSubscription.unsubscribe();
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

test("Successfully reads from Bluetooth device.", async () => {
    expect.assertions(1);
});
