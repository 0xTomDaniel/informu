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
    LowMuTagBattery,
    FailedToConnectToMuTag,
    RemoveMuTagInteractorImpl
} from "./RemoveMuTagInteractor";
import UserError from "../../shared/metaLanguage/UserError";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../../shared/bluetooth/Bluetooth";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import {
    Subscriber,
    Observable,
    Subject,
    BehaviorSubject,
    from,
    bindCallback,
    observable
} from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
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
const disconnectMock = jest.fn(
    (peripheralId: PeripheralId) =>
        new Promise<void>(resolve => {
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
const onScanStarted = startScanSubscriber.pipe(
    skip(1),
    filter((s): s is Subscriber<Peripheral> => s != null)
);
const onScanStopped = new Subject<void>();
const startScanMock = jest.fn<
    Observable<Peripheral>,
    [string[], Millisecond?, ScanMode?]
>(
    () =>
        new Observable<Peripheral>(subscriber => {
            startScanSubscriber.next(subscriber);
            const teardown = () => onScanStopped.next();
            return teardown;
        })
);
const stopScanMock = jest.fn(
    () =>
        new Promise<void>(resolve => {
            const foo = startScanSubscriber.value;
            debugger;
            startScanSubscriber.value?.complete();
            debugger;
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
const BluetoothMock = jest.fn<Bluetooth, any>(
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
    "[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
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

// TODO: In addition to Mu tag failing to connect, add another scenario where
// Mu tag cannot be found.

describe("Mu tag user removes Mu tag", (): void => {
    describe("Mu tag removes successfully", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable

        // Given the Mu tag battery is above threshold

        // Given Mu tag hardware unprovisions successfully

        let removePromise: Promise<void>;
        const executionOrder: number[] = [];
        let activityIndicatorPromise01: Promise<boolean>;
        let connectPromise01: Promise<[
            PeripheralId,
            (Millisecond | undefined)?
        ]>;
        let connectPromise02: Promise<[
            PeripheralId,
            (Millisecond | undefined)?
        ]>;
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
        let activityIndicatorPromise02: Promise<boolean>;

        // When
        //
        beforeAll(
            fakeSchedulers(async advance => {
                jest.useFakeTimers("modern");
                const onReadMock = new Subject<
                    [PeripheralId, ReadableCharacteristic<any>]
                >();
                const readValues = [
                    Hexadecimal.fromNumber(1),
                    Hexadecimal.fromString("0000"),
                    Hexadecimal.fromString("0001"),
                    muTagBatteryLevel
                ];
                readMock.mockImplementation(
                    (
                        peripheralId: PeripheralId,
                        characteristic: ReadableCharacteristic<any>
                    ) => {
                        onReadMock.next([peripheralId, characteristic]);
                        return Promise.resolve(readValues.shift());
                    }
                );
                activityIndicatorPromise01 = removeMuTagInteractor.showActivityIndicator
                    .pipe(skip(1), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(0));
                connectPromise01 = onConnectMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(1));
                connectPromise02 = onConnectMock
                    .pipe(skip(1), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(2));
                readPromise = onReadMock
                    .pipe(skip(3), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(3));
                writePromise = onWriteMock
                    .pipe(skip(2), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(4));
                removeMuTagPromise = onRemoveMuTagSpy
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(5));
                accountUpdateLocalPromise = onLocalUpdateMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(6));
                removeLocalMuTagPromise = onLocalRemoveByUidMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(7));
                accountUpdateRemotePromise = onRemoteUpdateMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(8));
                removeRemoteMuTagPromise = onRemoteRemoveByUidMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(9));
                activityIndicatorPromise02 = removeMuTagInteractor.showActivityIndicator
                    .pipe(skip(2), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(10));
                onConnectMock.pipe(take(2)).subscribe(([peripheralId]) => {
                    const foo = connections.get(peripheralId);
                    connections.get(peripheralId)?.next();
                });
                // user removes Mu tag
                removePromise = removeMuTagInteractor.remove(muTagUid);

                const startScanSbscrbr = await onScanStarted
                    .pipe(take(1))
                    .toPromise();
                startScanSbscrbr.next(discoveredPeripheral);
                advance(500);
            })
        );

        afterAll((): void => {
            jest.clearAllMocks();
            jest.useRealTimers();
            debugger;
        });

        // Then
        //
        it("should show busy indicator", async (): Promise<void> => {
            expect.assertions(2);
            await expect(activityIndicatorPromise01).resolves.toBe(true);
            expect(executionOrder[0]).toBe(0);
        });

        // Then
        //
        it("should connect to the Mu tag", async (): Promise<void> => {
            expect.assertions(4);
            await expect(connectPromise01).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[1]).toBe(1);
            await expect(connectPromise02).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[2]).toBe(2);
        });

        // Then
        //
        it("should check the Mu tag battery level", async (): Promise<void> => {
            expect.assertions(2);
            await expect(readPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            ]);
            expect(executionOrder[3]).toBe(3);
        });

        // Then
        //
        it("should unprovision the Mu tag hardware", async (): Promise<
            void
        > => {
            expect.assertions(2);
            await expect(writePromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Provision,
                MuTagBleGatt.MuTagConfiguration.Provision.unprovisionCode
            ]);
            expect(executionOrder[4]).toBe(4);
        });

        // Then
        //
        it("should remove the Mu tag from local persistence", async (): Promise<
            void
        > => {
            expect.assertions(6);
            await expect(removeMuTagPromise).resolves.toStrictEqual([
                muTagUid,
                beaconId
            ]);
            expect(executionOrder[5]).toBe(5);
            await expect(accountUpdateLocalPromise).resolves.toBe(account);
            expect(executionOrder[6]).toBe(6);
            await expect(removeLocalMuTagPromise).resolves.toBe(muTagUid);
            expect(executionOrder[7]).toBe(7);
        });

        // Then
        //
        it("should remove the Mu tag from remote persistence", async (): Promise<
            void
        > => {
            expect.assertions(4);
            await expect(accountUpdateRemotePromise).resolves.toBe(account);
            expect(executionOrder[8]).toBe(8);
            await expect(removeRemoteMuTagPromise).resolves.toStrictEqual([
                muTagUid,
                validAccountData._uid
            ]);
            expect(executionOrder[9]).toBe(9);
        });

        // Then
        //
        it("should hide busy indicator", async (): Promise<void> => {
            expect.assertions(2);
            await expect(activityIndicatorPromise02).resolves.toBe(false);
            await expect(removePromise).resolves.toBeUndefined();
        });
    });

    /*describe("Mu tag is unconnectable", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        getMock.mockResolvedValueOnce(account);
        getByUidMock.mockResolvedValueOnce(muTag);

        // Given Mu tag is unconnectable
        //
        const originatingError = Error("Failed to connect to device");

        let removePromise: Promise<void>;
        const executionOrder: number[] = [];
        let activityIndicatorPromise01: Promise<boolean>;
        let connectPromise: Promise<[PeripheralId, (Millisecond | undefined)?]>;
        let activityIndicatorPromise02: Promise<boolean>;
        let showErrorPromise: Promise<void>;

        // When
        //
        beforeAll(
            fakeSchedulers(async advance => {
                /*(bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
                    () => {
                        discoveredPeripheralSubscriber.next(
                            discoveredPeripheral
                        );
                    }
                );
                (bluetoothMock.connect as jest.Mock).mockImplementationOnce(
                    (peripheralId: PeripheralId) =>
                        new Observable<void>(subscriber => {
                            connections.set(peripheralId, subscriber);
                            subscriber.next();
                        })
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromNumber(1)
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromString("0000")
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromString("0001")
                );
                (bluetoothMock.connect as jest.Mock).mockImplementationOnce(
                    () =>
                        new Observable<void>(subscriber => {
                            subscriber.error(originatingError);
                        })
                );*/
    /*const onReadMock = new Subject<
                    [PeripheralId, ReadableCharacteristic<any>]
                >();
                const readValues = [
                    Hexadecimal.fromNumber(1),
                    Hexadecimal.fromString("0000"),
                    Hexadecimal.fromString("0001")
                ];
                readMock.mockImplementation(
                    (
                        peripheralId: PeripheralId,
                        characteristic: ReadableCharacteristic<any>
                    ) => {
                        onReadMock.next([peripheralId, characteristic]);
                        return Promise.resolve(readValues.shift());
                    }
                );
                activityIndicatorPromise01 = removeMuTagInteractor.showActivityIndicator
                    .pipe(skip(1), take(1))
                    .toPromise()
                    .finally(() => {
                        executionOrder.push(0);
                    });
                connectPromise = onConnectMock
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => {
                        executionOrder.push(1);
                    });
                activityIndicatorPromise02 = removeMuTagInteractor.showActivityIndicator
                    .pipe(skip(2), take(1))
                    .toPromise()
                    .finally(() => {
                        executionOrder.push(2);
                    });
                showErrorPromise = removeMuTagInteractor.showError
                    .pipe(take(1))
                    .toPromise()
                    .then(e => {
                        debugger;
                    })
                    .finally(() => {
                        executionOrder.push(3);
                    });
                onConnectMock.pipe(take(1)).subscribe(([peripheralId]) => {
                    const foo = connections.get(peripheralId);
                    connections.get(peripheralId)?.error(originatingError);
                });
                // user removes Mu tag
                removePromise = removeMuTagInteractor.remove(muTagUid);
                debugger;
                const startScanSbscrbr = await onScanStarted
                    .pipe(take(1))
                    .toPromise();
                debugger;
                startScanSbscrbr.next(discoveredPeripheral);
                advance(500);
            })
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show busy indicator", async () => {
            expect.assertions(2);
            await expect(activityIndicatorPromise01).resolves.toBe(true);
            expect(executionOrder[0]).toBe(0);
        });

        // Then
        //
        it("should connect to the Mu tag", async () => {
            expect.assertions(2);
            await expect(connectPromise).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[1]).toBe(1);
        });

        // Then
        //
        it("should hide busy indicator", async () => {
            expect.assertions(2);
            await expect(activityIndicatorPromise02).resolves.toBe(false);
            expect(executionOrder[2]).toBe(2);
        });

        // Then
        //
        it("should show message to move Mu tag closer to mobile device, check Mu tag battery level, and try again", async () => {
            expect.assertions(3);
            /*await expect(showErrorPromise).resolves.toBe(
                UserError.create(FailedToConnectToMuTag, originatingError)
            );
            expect(executionOrder[3]).toBe(3);*/
    /*await expect(removePromise).resolves.toBeUndefined();
        });
    });*/

    describe("Mu tag hardware fails to unprovision", (): void => {
        // There is currently no way to know if unprovision failed
    });

    /*describe("Mu tag battery is below threshold", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
            discoveredPeripheralSubscriber.next(discoveredPeripheral);
        });

        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromNumber(1)
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0000")
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0001")
        );

        // Given the Mu tag battery is above threshold
        //
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            new Percent(14)
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagInteractor.remove(muTagUid);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show busy indicator", (): void => {
            expect(
                removeMuTagInteractor.showActivityIndicator.toPromise()
            ).resolves.toBe(true);
        });

        // Then
        //
        it("should connect to the Mu tag", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                1,
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should disconnect from the Mu tag", (): void => {
            // This happens automatically because Mu tag restarts upon unprovision
        });

        // Then
        //
        it("should hide busy indicator", (): void => {
            expect(
                removeMuTagInteractor.showActivityIndicator.toPromise()
            ).resolves.toBe(false);
        });

        // Then
        //
        it("should show message that removal failed, Mu tag battery needs to be charged, and then try again", (): void => {
            expect(removeMuTagInteractor.showError.toPromise()).resolves.toBe(
                UserError.create(
                    LowMuTagBattery(removeMuTagBatteryThreshold.valueOf())
                )
            );
        });
    });*/
});
