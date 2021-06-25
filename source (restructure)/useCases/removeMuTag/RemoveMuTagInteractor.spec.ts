import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import {
    RemoveMuTagInteractorImpl,
    RemoveMuTagInteractorException
} from "./RemoveMuTagInteractor";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import BluetoothPort, {
    Peripheral,
    PeripheralId,
    ScanMode,
    BluetoothException
} from "../../shared/bluetooth/BluetoothPort";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import { Subscriber, Observable, Subject, BehaviorSubject } from "rxjs";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import { v4 as uuidV4 } from "uuid";
import { MuTagBleGatt } from "../../shared/muTagDevices/MuTagBleGatt/MuTagBleGatt";
import {
    WritableCharacteristic,
    ReadableCharacteristic
} from "../../shared/bluetooth/Characteristic";
import { Buffer } from "buffer";
import { take, skip, filter } from "rxjs/operators";
import BluetoothAndroidDecorator from "../../shared/bluetooth/BluetoothAndroidDecorator";
import { fakeSchedulers } from "rxjs-marbles/jest";
import {
    ExceptionType as MuTagDevicesExceptionType,
    MuTagDevicesException
} from "../../shared/muTagDevices/MuTagDevicesPort";

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

const onConnectMock = new Subject<[PeripheralId, Millisecond?]>();
const connections = new Map<PeripheralId, Subscriber<void>>();
const connectMock = jest.fn(
    (peripheralId: PeripheralId, timeout?: Millisecond) =>
        new Observable<void>(subscriber => {
            connections.set(peripheralId, subscriber);
            onConnectMock.next([peripheralId, timeout]);
        })
);
const onDisconnectMock = new Subject<PeripheralId>();
const disconnectMock = jest.fn(
    (peripheralId: PeripheralId) =>
        new Promise<void>(resolve => {
            const subscriber = connections.get(peripheralId);
            subscriber?.complete();
            connections.delete(peripheralId);
            onDisconnectMock.next(peripheralId);
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
const onStartScan = startScanSubscriber.pipe(
    skip(1),
    filter((s): s is Subscriber<Peripheral> => s != null)
);
//const onStopScanMock = new Subject<void>();
const bluetoothScanTimeoutException = BluetoothException.ScanTimeout;
const startScanMock = jest.fn<
    Observable<Peripheral>,
    [string[], Millisecond?, ScanMode?]
>(
    (uuids, timeout) =>
        new Observable(subscriber => {
            let timeoutId: NodeJS.Timeout | undefined;
            if (timeout != null) {
                timeoutId = setTimeout(() => {
                    subscriber.error(bluetoothScanTimeoutException);
                }, timeout);
            }
            const teardown = () => {
                if (timeoutId != null) {
                    clearTimeout(timeoutId);
                }
                //onStopScanMock.next();
            };
            startScanSubscriber.next(subscriber);
            return teardown;
        })
);
const stopScanMock = jest.fn(
    () =>
        new Promise<void>(resolve => {
            startScanSubscriber.value?.complete();
            startScanSubscriber.next(undefined);
            resolve();
        })
);
const onWriteMock = new Subject<
    [PeripheralId, WritableCharacteristic<any>, any]
>();
const writeMock = jest.fn(
    (
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<any>,
        value: any
    ) => {
        onWriteMock.next([peripheralId, characteristic, value]);
        return Promise.resolve();
    }
);
const BluetoothMock = jest.fn<BluetoothPort, any>(
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

const getByUidMock = jest.fn<Promise<ProvisionedMuTag>, [string]>();
const onLocalRemoveByUidMock = new Subject<string>();
const localRemoveByUidMock = jest.fn((uid: string) => {
    onLocalRemoveByUidMock.next(uid);
    return Promise.resolve();
});
const MuTagRepoLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        getByUid: getByUidMock,
        removeByUid: localRemoveByUidMock
    })
);
const muTagRepoLocalMock = new MuTagRepoLocalMock();

const onRemoteRemoveByUidMock = new Subject<[string, string]>();
const remoteRemoveByUidMock = jest.fn((uid: string, accountUid: string) => {
    onRemoteRemoveByUidMock.next([uid, accountUid]);
    return Promise.resolve();
});
const MuTagRepoRemoteMock = jest.fn<MuTagRepositoryRemotePort, any>(
    (): MuTagRepositoryRemotePort => ({
        removeByUid: remoteRemoveByUidMock
    })
);
const muTagRepoRemoteMock = new MuTagRepoRemoteMock();

const getMock = jest.fn<Promise<Account>, []>();
const onLocalUpdateMock = new Subject<Account>();
const localUpdateMock = jest.fn((account: Account) => {
    onLocalUpdateMock.next(account);
    return Promise.resolve();
});
const AccountRepoLocalMock = jest.fn<AccountRepositoryLocalPort, any>(
    (): AccountRepositoryLocalPort => ({
        get: getMock,
        update: localUpdateMock
    })
);
const accountRepoLocalMock = new AccountRepoLocalMock();

const onRemoteUpdateMock = new Subject<Account>();
const remoteUpdateMock = jest.fn((account: Account) => {
    onRemoteUpdateMock.next(account);
    return Promise.resolve();
});
const AccountRepoRemoteMock = jest.fn<AccountRepositoryRemotePort, any>(
    (): AccountRepositoryRemotePort => ({
        update: remoteUpdateMock
    })
);
const accountRepoRemoteMock = new AccountRepoRemoteMock();

const removeMuTagBatteryThreshold = new Percent(15);
const removeMuTagInteractor = new RemoveMuTagInteractorImpl(
    removeMuTagBatteryThreshold,
    muTagDevices,
    accountRepoLocalMock,
    accountRepoRemoteMock,
    muTagRepoLocalMock,
    muTagRepoRemoteMock
);

const muTagUid = uuidV4();
const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
const validAccountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Josh McDaniel",
    _nextBeaconId: BeaconId.create("A"),
    _nextSafeZoneNumber: 3,
    _recycledBeaconIds: new Set(recycledBeaconIds),
    _nextMuTagNumber: 10,
    _onboarding: false,
    _muTags: new Set([muTagUid])
};
const account = new Account(validAccountData);
const onRemoveMuTagSpy = new Subject<[string, BeaconId]>();
const removeMuTagOriginal = account.removeMuTag.bind(account);
const removeMuTagSpy = jest.spyOn(account, "removeMuTag");
removeMuTagSpy.mockImplementation((uid, beaconId) => {
    onRemoveMuTagSpy.next([uid, beaconId]);
    removeMuTagOriginal(uid, beaconId);
});
const beaconId = BeaconId.create("1");
const muTagBatteryLevel = new Percent(16);
const newMuTagAttachedTo = "keys";
const muTagColorSetting = MuTagColor.Scarlet;
const muTagIsSafe = true;
const muTagLastSeen = new Date();
const muTag = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: muTagBatteryLevel,
    _beaconId: beaconId,
    _color: muTagColorSetting,
    _dateAdded: muTagLastSeen,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: muTagIsSafe,
    _lastSeen: muTagLastSeen,
    _macAddress: "AABBCCDDFF67",
    _modelNumber: "REV8",
    _muTagNumber: 1,
    _name: newMuTagAttachedTo,
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: muTagUid
});
const manufacturerDataJson =
    "[2, 1, 6, 26, 255, 76, 0, 2, 21, 222, 126, 199, 237, 16, 85, 176, 85, 192, 222, 222, 254, 167, 237, 250, 126, 0, 0, 0, 1, 182, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]";
const manufacturerData = Buffer.from(JSON.parse(manufacturerDataJson));
const discoveredPeripheral: Peripheral = {
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

describe("MuTag user removes MuTag.", (): void => {
    describe("Scenario 1: MuTag removes successfully.", (): void => {
        // Given that the account connected to the current MuTag is logged in
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given MuTag is connectable

        // Given the MuTag battery is above threshold

        // Given MuTag hardware unprovisions successfully

        let removePromise: Promise<void> | undefined;
        const executionOrder: number[] = [];
        let connectPromise: Promise<[PeripheralId, (Millisecond | undefined)?]>;
        let readPromise: Promise<[PeripheralId, ReadableCharacteristic<any>]>;
        let writePromise: Promise<[
            PeripheralId,
            WritableCharacteristic<any>,
            any
        ]>;
        let removeMuTagPromise: Promise<[string, BeaconId]>;
        let accountUpdateLocalPromise: Promise<Account>;
        let removeLocalMuTagPromise: Promise<string>;
        let accountUpdateRemotePromise: Promise<Account>;
        let removeRemoteMuTagPromise: Promise<[string, string]>;

        // When
        //
        beforeAll(async () => {
            const onReadMock = new Subject<
                [PeripheralId, ReadableCharacteristic<any>]
            >();
            readMock.mockImplementationOnce(
                (
                    peripheralId: PeripheralId,
                    characteristic: ReadableCharacteristic<any>
                ) => {
                    onReadMock.next([peripheralId, characteristic]);
                    return Promise.resolve(muTagBatteryLevel);
                }
            );
            connectPromise = onConnectMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(0));
            readPromise = onReadMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(1));
            writePromise = onWriteMock
                .pipe(skip(1), take(1))
                .toPromise()
                .finally(() => executionOrder.push(2));
            removeMuTagPromise = onRemoveMuTagSpy
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(3));
            accountUpdateLocalPromise = onLocalUpdateMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(4));
            removeLocalMuTagPromise = onLocalRemoveByUidMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(5));
            accountUpdateRemotePromise = onRemoteUpdateMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(6));
            removeRemoteMuTagPromise = onRemoteRemoveByUidMock
                .pipe(take(1))
                .toPromise()
                .finally(() => executionOrder.push(7));
            onConnectMock
                .pipe(take(1))
                .subscribe(([peripheralId]) =>
                    connections.get(peripheralId)?.next()
                );
            // user removes MuTag
            removePromise = removeMuTagInteractor.remove(muTagUid);
            const startScanSbscrbr = await onStartScan
                .pipe(take(1))
                .toPromise();
            startScanSbscrbr.next(discoveredPeripheral);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should connect to the MuTag.", async (): Promise<void> => {
            expect.assertions(2);
            await expect(connectPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[0]).toBe(0);
        });

        // Then
        //
        it("Should check the MuTag battery level.", async (): Promise<void> => {
            expect.assertions(2);
            await expect(readPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            ]);
            expect(executionOrder[1]).toBe(1);
        });

        // Then
        //
        it("Should unprovision the MuTag hardware.", async () => {
            expect.assertions(2);
            await expect(writePromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Provision,
                MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
            ]);
            expect(executionOrder[2]).toBe(2);
        });

        // Then
        //
        it("Should remove the MuTag from local persistence.", async (): Promise<
            void
        > => {
            expect.assertions(6);
            await expect(removeMuTagPromise).resolves.toStrictEqual([
                muTagUid,
                beaconId
            ]);
            expect(executionOrder[3]).toBe(3);
            await expect(accountUpdateLocalPromise).resolves.toBe(account);
            expect(executionOrder[4]).toBe(4);
            await expect(removeLocalMuTagPromise).resolves.toBe(muTagUid);
            expect(executionOrder[5]).toBe(5);
        });

        // Then
        //
        it("Should remove the MuTag from remote persistence.", async (): Promise<
            void
        > => {
            expect.assertions(5);
            await expect(accountUpdateRemotePromise).resolves.toBe(account);
            expect(executionOrder[6]).toBe(6);
            await expect(removeRemoteMuTagPromise).resolves.toStrictEqual([
                muTagUid,
                validAccountData._uid
            ]);
            expect(executionOrder[7]).toBe(7);
            await expect(removePromise).resolves.toBeUndefined();
            removePromise = undefined;
        });
    });

    describe("Scenario 2: MuTag not found.", (): void => {
        // Given that the account connected to the current MuTag is logged in.
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given that MuTag cannot be found.
        //
        const sourceException = MuTagDevicesException.FailedToFindMuTag(
            bluetoothScanTimeoutException
        );
        const error = RemoveMuTagInteractorException.FailedToFindMuTag(
            muTagUid,
            sourceException
        );

        let removePromise: Promise<void>;

        // When
        //
        beforeAll(
            fakeSchedulers(async advance => {
                jest.useFakeTimers("modern");
                // user removes MuTag
                removePromise = removeMuTagInteractor.remove(muTagUid);
                await onStartScan.pipe(take(1)).toPromise();
                advance(5000);
            })
        );

        afterAll((): void => {
            jest.clearAllMocks();
            jest.useRealTimers();
        });

        // Then
        //
        it("Should show 'failed to find MuTag' error message.", async () => {
            expect.assertions(1);
            await expect(removePromise).rejects.toStrictEqual(error);
        });
    });

    describe("Scenario 3: MuTag connection fails.", (): void => {
        // Given that the account connected to the current MuTag is logged in.
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given that MuTag connection fails.
        //
        let sourceException: MuTagDevicesException<MuTagDevicesExceptionType>;

        let removePromise: Promise<void>;
        let connectPromise: Promise<[PeripheralId, (Millisecond | undefined)?]>;

        // When
        //
        beforeAll(async () => {
            connectPromise = onConnectMock.pipe(take(1)).toPromise();
            onConnectMock.pipe(take(1)).subscribe(([peripheralId]) => {
                sourceException = MuTagDevicesException.FailedToConnectToMuTag(
                    BluetoothException.FailedToConnect(peripheralId)
                );
                connections.get(peripheralId)?.error(sourceException);
            });
            // user removes MuTag
            removePromise = removeMuTagInteractor.remove(muTagUid);
            const startScanSbscrbr = await onStartScan
                .pipe(take(1))
                .toPromise();
            startScanSbscrbr.next(discoveredPeripheral);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should connect to the MuTag.", async () => {
            expect.assertions(1);
            await expect(connectPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
        });

        // Then
        //
        it("Should reject with 'failed to reset' error message.", async () => {
            expect.assertions(1);
            await expect(removePromise).rejects.toStrictEqual(
                RemoveMuTagInteractorException.FailedToResetMuTag(
                    muTagUid,
                    sourceException
                )
            );
        });
    });

    describe("Scenario 4: MuTag hardware fails to unprovision", (): void => {
        // There is currently no way to know if unprovision failed
    });

    describe("Scenario 5: MuTag battery is below threshold", (): void => {
        // Given that the account connected to the current MuTag is logged in
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given MuTag is connectable

        // Given the MuTag battery is below threshold
        //
        const lowBatteryLevel = new Percent(14);

        let removePromise: Promise<void> | undefined;
        const executionOrder: number[] = [];
        let connectPromise: Promise<[PeripheralId, (Millisecond | undefined)?]>;
        let disconnectPromise: Promise<PeripheralId>;
        let readPromise: Promise<[PeripheralId, ReadableCharacteristic<any>]>;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                const onReadMock = new Subject<
                    [PeripheralId, ReadableCharacteristic<any>]
                >();
                readMock.mockImplementationOnce(
                    (
                        peripheralId: PeripheralId,
                        characteristic: ReadableCharacteristic<any>
                    ) => {
                        onReadMock.next([peripheralId, characteristic]);
                        return Promise.resolve(lowBatteryLevel);
                    }
                );
                connectPromise = onConnectMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(0));
                readPromise = onReadMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(1));
                disconnectPromise = onDisconnectMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(2));
                onConnectMock
                    .pipe(take(1))
                    .subscribe(([peripheralId]) =>
                        connections.get(peripheralId)?.next()
                    );
                // user removes MuTag
                removePromise = removeMuTagInteractor.remove(muTagUid);
                const startScanSbscrbr = await onStartScan
                    .pipe(take(1))
                    .toPromise();
                startScanSbscrbr.next(discoveredPeripheral);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should connect to the MuTag.", async (): Promise<void> => {
            expect.assertions(2);
            await expect(connectPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[0]).toBe(0);
        });

        // Then
        //
        it("Should check the MuTag battery level.", async (): Promise<void> => {
            expect.assertions(2);
            await expect(readPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            ]);
            expect(executionOrder[1]).toBe(1);
        });

        // Then
        //
        it("should disconnect from the MuTag", async (): Promise<void> => {
            expect.assertions(2);
            await expect(disconnectPromise).resolves.toBe(
                discoveredPeripheral.id
            );
            expect(executionOrder[2]).toBe(2);
        });

        // Then
        //
        it("should reject with 'low MuTag battery' error message.", async (): Promise<
            void
        > => {
            expect.assertions(1);
            await expect(removePromise).rejects.toStrictEqual(
                RemoveMuTagInteractorException.LowMuTagBattery(
                    removeMuTagBatteryThreshold.valueOf()
                )
            );
        });
    });
});
