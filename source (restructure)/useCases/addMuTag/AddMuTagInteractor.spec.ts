import { AddMuTagInteractorImpl } from "./AddMuTagInteractor";
import Percent from "../../shared/metaLanguage/Percent";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import BluetoothPort, {
    Peripheral,
    PeripheralId,
    ScanMode
} from "../../shared/bluetooth/BluetoothPort";
import { Observable, Subscriber, Subject, BehaviorSubject } from "rxjs";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import { v4 as uuidV4 } from "uuid";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import { MuTagBleGatt } from "../../shared/muTagDevices/MuTagBleGatt/MuTagBleGatt";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import { Buffer } from "buffer";
import { take, skip, filter, takeLast, toArray, tap } from "rxjs/operators";
import BluetoothAndroidDecorator from "../../shared/bluetooth/BluetoothAndroidDecorator";
import {
    WritableCharacteristic,
    ReadableCharacteristic
} from "../../shared/bluetooth/Characteristic";

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

const connections = new Map<PeripheralId, Subscriber<void>>();
const startScanSubscriber = new BehaviorSubject<
    Subscriber<Peripheral> | undefined
>(undefined);
const onStartScanSubscriber = startScanSubscriber.pipe(
    skip(1),
    filter((s): s is Subscriber<Peripheral> => s != null)
);
let bluetoothReadReturnValue: any;
const bluetoothMocks = {
    onConnect: new Subject<[PeripheralId, Millisecond?]>(),
    onDisconnect: new Subject<PeripheralId>(),
    onRead: new Subject<[PeripheralId, ReadableCharacteristic<any>]>(),
    onStartScan: new Subject<[string[], Millisecond?, ScanMode?]>(),
    onStopScan: new Subject<void>(),
    onWrite: new Subject<[PeripheralId, WritableCharacteristic<any>, any]>(),
    connect: jest.fn(
        (peripheralId: PeripheralId, timeout?: Millisecond) =>
            new Observable<void>(subscriber => {
                connections.set(peripheralId, subscriber);
                subscriber.next();
                bluetoothMocks.onConnect.next([peripheralId, timeout]);
            })
    ),
    disconnect: jest.fn((peripheralId: PeripheralId) => {
        const subscriber = connections.get(peripheralId);
        subscriber?.complete();
        connections.delete(peripheralId);
        bluetoothMocks.onDisconnect.next(peripheralId);
        return Promise.resolve();
    }),
    read: jest.fn(
        (
            peripheralId: PeripheralId,
            characteristic: ReadableCharacteristic<any>
        ) => {
            bluetoothMocks.onRead.next([peripheralId, characteristic]);
            return bluetoothReadReturnValue;
        }
    ),
    startScan: jest.fn(
        (serviceUuids: string[], timeout?: Millisecond, scanMode?: ScanMode) =>
            new Observable<Peripheral>(subscriber => {
                let timeoutId: NodeJS.Timeout | undefined;
                if (timeout != null) {
                    timeoutId = setTimeout(() => {
                        subscriber.complete();
                    }, timeout);
                }
                bluetoothMocks.onStartScan.next([
                    serviceUuids,
                    timeout,
                    scanMode
                ]);
                startScanSubscriber.next(subscriber);
                const teardown = () => {
                    if (timeoutId != null) {
                        clearTimeout(timeoutId);
                    }
                };
                return teardown;
            })
    ),
    stopScan: jest.fn(() => {
        startScanSubscriber.value?.complete();
        startScanSubscriber.next(undefined);
        bluetoothMocks.onStopScan.next();
        return Promise.resolve();
    }),
    write: jest.fn(
        (
            peripheralId: PeripheralId,
            characteristic: WritableCharacteristic<any>,
            value: any
        ) => {
            debugger;
            bluetoothMocks.onWrite.next([peripheralId, characteristic, value]);
            return Promise.resolve();
        }
    )
};
const BluetoothMock = jest.fn<BluetoothPort, any>(
    (): BluetoothPort => ({
        connect: bluetoothMocks.connect,
        disconnect: bluetoothMocks.disconnect,
        read: bluetoothMocks.read,
        startScan: bluetoothMocks.startScan,
        stopScan: bluetoothMocks.stopScan,
        write: bluetoothMocks.write
    })
);
const bluetoothMock = new BluetoothMock();
const bluetoothAndroidDecorator = new BluetoothAndroidDecorator(bluetoothMock);
const muTagDevices = new MuTagDevices(bluetoothAndroidDecorator);

const muTagRepoLocalMocks = {
    onAdd: new Subject<ProvisionedMuTag>(),
    onRemoveByUid: new Subject<string>(),
    onUpdate: new Subject<ProvisionedMuTag>(),
    add: jest.fn((muTag: ProvisionedMuTag) => {
        muTagRepoLocalMocks.onAdd.next(muTag);
        return Promise.resolve();
    }),
    removeByUid: jest.fn((uid: string) => {
        muTagRepoLocalMocks.onRemoveByUid.next(uid);
        return Promise.resolve();
    }),
    update: jest.fn<Promise<void>, [ProvisionedMuTag]>(
        (muTag: ProvisionedMuTag) => {
            muTagRepoLocalMocks.onUpdate.next(muTag);
            return Promise.resolve();
        }
    )
};
const MuTagRepoLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        add: muTagRepoLocalMocks.add,
        update: muTagRepoLocalMocks.update,
        removeByUid: muTagRepoLocalMocks.removeByUid
    })
);
const muTagRepoLocalMock = new MuTagRepoLocalMock();

const muTagRepoRemoteMocks = {
    onAdd: new Subject<[ProvisionedMuTag, string, AccountNumber]>(),
    onCreateNewUid: new Subject<string>(),
    onRemoveByUid: new Subject<[string, string]>(),
    onUpdate: new Subject<[ProvisionedMuTag, string, AccountNumber]>(),
    add: jest.fn(
        (
            muTag: ProvisionedMuTag,
            accountUid: string,
            accountNumber: AccountNumber
        ) => {
            muTagRepoRemoteMocks.onAdd.next([muTag, accountUid, accountNumber]);
            return Promise.resolve();
        }
    ),
    createNewUid: jest.fn((accountUid: string) => {
        muTagRepoRemoteMocks.onCreateNewUid.next(accountUid);
        return uuidV4();
    }),
    removeByUid: jest.fn((uid: string, accountUid: string) => {
        muTagRepoRemoteMocks.onRemoveByUid.next([uid, accountUid]);
        return Promise.resolve();
    }),
    update: jest.fn(
        (
            muTag: ProvisionedMuTag,
            accountUid: string,
            accountNumber: AccountNumber
        ) => {
            muTagRepoRemoteMocks.onUpdate.next([
                muTag,
                accountUid,
                accountNumber
            ]);
            return Promise.resolve();
        }
    )
};
const MuTagRepoRemoteMock = jest.fn<MuTagRepositoryRemotePort, any>(
    (): MuTagRepositoryRemotePort => ({
        add: muTagRepoRemoteMocks.add,
        update: muTagRepoRemoteMocks.update,
        createNewUid: muTagRepoRemoteMocks.createNewUid,
        removeByUid: muTagRepoRemoteMocks.removeByUid
    })
);
const muTagRepoRemoteMock = new MuTagRepoRemoteMock();

const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
const validAccountData: AccountData = {
    _uid: uuidV4(),
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Taylor Black",
    _nextBeaconId: BeaconId.create("A"),
    _nextSafeZoneNumber: 1,
    _recycledBeaconIds: new Set(recycledBeaconIds),
    _nextMuTagNumber: 10,
    _onboarding: false,
    _muTags: new Set([uuidV4()])
};
const account = new Account(validAccountData);

const accountRepoLocalMocks = {
    onGet: new Subject<void>(),
    onUpdate: new Subject<Account>(),
    get: jest.fn(() => {
        accountRepoLocalMocks.onGet.next();
        return Promise.resolve(account);
    }),
    update: jest.fn((accnt: Account) => {
        accountRepoLocalMocks.onUpdate.next(accnt);
        return Promise.resolve();
    })
};
const AccountRepoLocalMock = jest.fn<AccountRepositoryLocalPort, any>(
    (): AccountRepositoryLocalPort => ({
        get: accountRepoLocalMocks.get,
        update: accountRepoLocalMocks.update
    })
);
const accountRepoLocalMock = new AccountRepoLocalMock();

const accountRepoRemoteMocks = {
    onUpdate: new Subject<Account>(),
    update: jest.fn((accnt: Account) => {
        accountRepoRemoteMocks.onUpdate.next(accnt);
        return Promise.resolve();
    })
};
const AccountRepoRemoteMock = jest.fn<AccountRepositoryRemotePort, any>(
    (): AccountRepositoryRemotePort => ({
        update: accountRepoRemoteMocks.update
    })
);
const accountRepoRemoteMock = new AccountRepoRemoteMock();

const addMuTagConnectThreshold = -72 as Rssi;
const addMuTagBatteryThreshold = new Percent(15);
const addMuTagInteractor = new AddMuTagInteractorImpl(
    addMuTagConnectThreshold,
    addMuTagBatteryThreshold,
    muTagDevices,
    muTagRepoLocalMock,
    muTagRepoRemoteMock,
    accountRepoLocalMock,
    accountRepoRemoteMock
);

//const manufacturerDataJson =
//"[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
const manufacturerDataJson =
    "[2, 1, 6, 26, 255, 76, 0, 2, 21, 222, 126, 199, 237, 16, 85, 176, 85, 192, 222, 222, 254, 167, 237, 250, 126, 255, 255, 255, 255, 182, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]";
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
const newMuTagName = "Keys";

describe("User adds Mu tag.", (): void => {
    describe("Scenario 1: Mu tag adds successfully.", (): void => {
        // Given that an account is logged in

        // Given the Mu tag battery is above threshold
        //
        bluetoothReadReturnValue = new Percent(45);

        // Given Mu tag hardware provisions successfully

        const onAccountAddNewMuTag = new Subject<[string, BeaconId]>();
        const addNewMuTagOriginal = account.addNewMuTag.bind(account);
        const accountAddNewMuTagSpy = jest.spyOn(account, "addNewMuTag");
        accountAddNewMuTagSpy.mockImplementation((uid, beaconId) => {
            addNewMuTagOriginal(uid, beaconId);
            onAccountAddNewMuTag.next([uid, beaconId]);
        });

        let newMuTag: ProvisionedMuTag;
        let muTagSetNameSpy: jest.SpyInstance<void, [string]>;
        const onMuTagSetName = new Subject<string>();
        const originalAddMock = muTagRepoLocalMocks.add;
        muTagRepoLocalMocks.add.mockImplementationOnce(
            async (addedMuTag: ProvisionedMuTag) => {
                newMuTag = addedMuTag;
                const muTagSetNameOriginal = newMuTag.setName.bind(newMuTag);
                muTagSetNameSpy = jest.spyOn(newMuTag, "setName");
                muTagSetNameSpy.mockImplementation(name => {
                    muTagSetNameOriginal(name);
                    onMuTagSetName.next(name);
                });
                await originalAddMock(newMuTag);
            }
        );

        const executionOrder: number[] = [];

        let onFindUnprovisioned: Promise<[string[], Millisecond?, ScanMode?]>;
        let onStopFindUnprovisioned: Promise<void>;
        let onConnectUnprovisioned: Promise<[
            PeripheralId,
            (Millisecond | undefined)?
        ]>;
        let onVerifyBatteryLevel: Promise<[
            PeripheralId,
            ReadableCharacteristic<any>
        ]>;
        let onAddMuTagRemotePersistence: Promise<[
            ProvisionedMuTag,
            string,
            AccountNumber
        ]>;
        let onAddMuTagLocalPersistence: Promise<ProvisionedMuTag>;
        let onAddMuTagToAccount: Promise<[string, BeaconId]>;
        let onUpdateAccountRemotePersistence: Promise<Account>;
        let onUpdateAccountLocalPersistence: Promise<Account>;
        let onProvisionMuTag: Promise<[
            PeripheralId,
            WritableCharacteristic<any>,
            any
        ][]>;
        let onSetTxPower: Promise<[
            PeripheralId,
            WritableCharacteristic<any>,
            any
        ]>;
        let onSetAdvertisingInterval: Promise<[
            PeripheralId,
            WritableCharacteristic<any>,
            any
        ]>;
        let onDisconnect: Promise<PeripheralId>;
        let onSetMuTagEntityName: Promise<string>;
        let onUpdateMuTagLocalPersistence: Promise<ProvisionedMuTag>;
        let onUpdateMuTagRemotePersistence: Promise<[
            ProvisionedMuTag,
            string,
            AccountNumber
        ]>;

        let findNewMuTagPromise: Promise<void>;
        let addFoundMuTagPromise: Promise<void>;
        let setMuTagName: Promise<void>;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                onStartScanSubscriber
                    .pipe(take(1))
                    .toPromise()
                    .then(subscriber => subscriber.next(discoveredPeripheral));
                onFindUnprovisioned = bluetoothMocks.onStartScan
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(0));
                onStopFindUnprovisioned = bluetoothMocks.onStopScan
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(1));
                onConnectUnprovisioned = bluetoothMocks.onConnect
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(2));
                onVerifyBatteryLevel = bluetoothMocks.onRead
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(3));
                onAddMuTagRemotePersistence = muTagRepoRemoteMocks.onAdd
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(4));
                onAddMuTagLocalPersistence = muTagRepoLocalMocks.onAdd
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(5));
                onAddMuTagToAccount = onAccountAddNewMuTag
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(6));
                onUpdateAccountRemotePersistence = accountRepoRemoteMocks.onUpdate
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(7));
                onUpdateAccountLocalPersistence = accountRepoLocalMocks.onUpdate
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(8));
                onProvisionMuTag = bluetoothMocks.onWrite
                    .pipe(skip(1), take(3), takeLast(3), toArray())
                    .toPromise()
                    .finally(() => executionOrder.push(9));
                onSetTxPower = bluetoothMocks.onWrite
                    .pipe(skip(4), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(10));
                onSetAdvertisingInterval = bluetoothMocks.onWrite
                    .pipe(skip(5), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(11));
                onDisconnect = bluetoothMocks.onDisconnect
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(12));
                onSetMuTagEntityName = onMuTagSetName
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(13));
                onUpdateMuTagLocalPersistence = muTagRepoLocalMocks.onUpdate
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(14));
                onUpdateMuTagRemotePersistence = muTagRepoRemoteMocks.onUpdate
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(15));
                // user requests to add unprovisioned Mu tag
                findNewMuTagPromise = addMuTagInteractor.findNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should find unprovisioned Mu tag.", async () => {
            expect.assertions(5);
            await expect(onFindUnprovisioned).resolves.toStrictEqual([
                [],
                30000,
                ScanMode.LowLatency
            ]);
            expect(executionOrder[0]).toBe(0);
            await expect(onStopFindUnprovisioned).resolves.toBeUndefined();
            expect(executionOrder[1]).toBe(1);
            await expect(findNewMuTagPromise).resolves.toBeUndefined();
        });

        // Then
        //
        it("Should connect to unprovisioned Mu tag.", async () => {
            expect.assertions(2);
            addFoundMuTagPromise = addMuTagInteractor.addFoundMuTag();
            await expect(onConnectUnprovisioned).resolves.toStrictEqual([
                discoveredPeripheral.id,
                undefined
            ]);
            expect(executionOrder[2]).toBe(2);
        });

        // Then
        //
        it("Should verify Mu tag battery level.", async () => {
            expect.assertions(2);
            await expect(onVerifyBatteryLevel).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            ]);
            expect(executionOrder[3]).toBe(3);
        });

        // Then
        //
        it("Should add Mu tag to remote persistence.", async () => {
            expect.assertions(2);
            await expect(onAddMuTagRemotePersistence).resolves.toStrictEqual([
                newMuTag,
                account.uid,
                account.accountNumber
            ]);
            expect(executionOrder[4]).toBe(4);
        });

        // Then
        //
        it("Should add Mu tag to local persistence.", async () => {
            expect.assertions(2);
            await expect(onAddMuTagLocalPersistence).resolves.toStrictEqual(
                newMuTag
            );
            expect(executionOrder[5]).toBe(5);
        });

        // Then
        //
        it("Should add Mu tag to account.", async () => {
            expect.assertions(5);
            await expect(onAddMuTagToAccount).resolves.toStrictEqual([
                newMuTag.uid,
                newMuTag.beaconId
            ]);
            expect(executionOrder[6]).toBe(6);
            expect(account.muTags.size).toBe(2);
            expect(account.newBeaconId).toEqual(recycledBeaconIds[1]);
            expect(account.newMuTagNumber).toEqual(
                validAccountData._nextMuTagNumber + 1
            );
        });

        // Then
        //
        it("Should update account to remote persistence.", async () => {
            expect.assertions(2);
            await expect(
                onUpdateAccountRemotePersistence
            ).resolves.toStrictEqual(account);
            expect(executionOrder[7]).toBe(7);
        });

        // Then
        //
        it("Should update account to local persistence.", async () => {
            expect.assertions(2);
            await expect(
                onUpdateAccountLocalPersistence
            ).resolves.toStrictEqual(account);
            expect(executionOrder[8]).toBe(8);
        });

        // Then
        //
        it("Should provision Mu tag hardware.", async () => {
            expect.assertions(2);
            await expect(onProvisionMuTag).resolves.toStrictEqual([
                [
                    discoveredPeripheral.id,
                    MuTagBleGatt.MuTagConfiguration.Major,
                    Hexadecimal.fromString("0000")
                ],
                [
                    discoveredPeripheral.id,
                    MuTagBleGatt.MuTagConfiguration.Minor,
                    Hexadecimal.fromString("0002")
                ],
                [
                    discoveredPeripheral.id,
                    MuTagBleGatt.MuTagConfiguration.Provision,
                    MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
                ]
            ]);
            expect(executionOrder[9]).toBe(9);
        });

        // Then
        //
        it("Should set TX power to highest option 0x01 (+6dBm).", async () => {
            expect.assertions(2);
            await expect(onSetTxPower).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.TxPower,
                Hexadecimal.fromString("01")
            ]);

            // TODO: ensure Mu tag entity updated.

            expect(executionOrder[10]).toBe(10);
        });

        // Then
        //
        it("Should set advertising interval to 0x03 (852ms).", async () => {
            expect.assertions(2);
            await expect(onSetAdvertisingInterval).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
                Hexadecimal.fromString("03")
            ]);

            // TODO: ensure Mu tag entity updated.

            expect(executionOrder[11]).toBe(11);
        });

        // Then
        //
        it("Should disconnect from Mu tag.", async () => {
            expect.assertions(3);
            await expect(onDisconnect).resolves.toBe(discoveredPeripheral.id);
            expect(executionOrder[12]).toBe(12);
            await expect(addFoundMuTagPromise).resolves.toBeUndefined();
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it("Should update Mu tag name.", async () => {
            setMuTagName = addMuTagInteractor.setMuTagName(newMuTagName);
            expect.assertions(2);
            await expect(onSetMuTagEntityName).resolves.toBe(newMuTagName);
            expect(executionOrder[13]).toBe(13);
        });

        // Then
        //
        it("Should update Mu tag to local persistence.", async () => {
            expect.assertions(2);
            await expect(onUpdateMuTagLocalPersistence).resolves.toBe(newMuTag);
            expect(executionOrder[14]).toBe(14);
        });

        // Then
        //
        it("Should update Mu tag to remote persistence.", async () => {
            expect.assertions(3);
            await expect(
                onUpdateMuTagRemotePersistence
            ).resolves.toStrictEqual([
                newMuTag,
                validAccountData._uid,
                validAccountData._accountNumber
            ]);
            expect(executionOrder[15]).toBe(15);
            await expect(setMuTagName).resolves.toBeUndefined();
        });
    });

    /*describe("Scenario 2: Mu tag adds successfully after connection delay.", (): void => {
        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected after user completes Mu tag naming
        //
        //const userEntersMuTagNameAfter = 1000 as Millisecond;
        //const muTagConnectsAfter = 2000 as Millisecond;
        const discoveredPeripheralNotifier = new Subject<void>();
        const startScanCompleteNotifier = new Subject<void>();
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
            async () => {
                await discoveredPeripheralNotifier.pipe(take(1)).toPromise();
                discoveredPeripheralSubscriber.next(discoveredPeripheral);
                await startScanCompleteNotifier.pipe(take(1)).toPromise();
            }
        );

        // Given the Mu tag battery is above threshold
        //
        const muTagBatteryLevel = new Percent(45);

        // Given Mu tag hardware provisions successfully
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (accountRepoLocalMock.update as jest.Mock).mockResolvedValueOnce(
            undefined
        );

        let didNavigateToNameMuTag = false;
        let didNavigateToMuTagConnecting = false;
        let startAddingNewMuTagPromise: Promise<void>;
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            muTagBatteryLevel
        );
        let didShowMuTagFinalSetupScreen = false;
        let newMuTag: ProvisionedMuTag;
        let muTagUpdateColorSpy: jest.SpyInstance<void, [MuTagColor]>;
        (muTagRepoLocalMock.add as jest.Mock).mockImplementationOnce(
            (addedMuTag: ProvisionedMuTag) => {
                newMuTag = addedMuTag;
                muTagUpdateColorSpy = jest.spyOn(newMuTag, "changeColor");
            }
        );
        const muTagColorSetting = MuTagColor.MuOrange;
        let didShowActivityIndicatorTimes = 0;
        let didNavigateToHomeScreen = false;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                addMuTagViewModel.onNavigateToNameMuTag(
                    () => (didNavigateToNameMuTag = true)
                );
                nameMuTagViewModel.onNavigateToMuTagAdding(
                    () => (didNavigateToMuTagConnecting = true)
                );
                nameMuTagViewModel.onNavigateToMuTagSettings(
                    () => (didShowMuTagFinalSetupScreen = true)
                );
                nameMuTagViewModel.onDidUpdate(change => {
                    if (
                        "showActivityIndicator" in change &&
                        change.showActivityIndicator
                    ) {
                        didShowActivityIndicatorTimes += 1;
                    }
                });
                nameMuTagViewModel.onNavigateToHomeScreen(
                    () => (didNavigateToHomeScreen = true)
                );
                // user requests to add unprovisioned Mu tag
                startAddingNewMuTagPromise = addMuTagInteractor.startAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        // "should show instructions for adding Mu tag"

        // Then
        //
        it("should attempt connection to unprovisioned Mu tag", (): void => {
            expect(bluetoothMock.startScan).toHaveBeenCalledWith([], 120000, 2);
            expect(bluetoothMock.startScan).toHaveBeenCalledTimes(1);
        });

        // When user completes instructions for adding Mu tag
        //
        // Then
        //
        it("should show Mu tag naming screen", (): void => {
            addMuTagInteractor.instructionsComplete();
            expect(didNavigateToNameMuTag).toBe(true);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it("should show Mu tag connecting screen", async (): Promise<void> => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(didNavigateToMuTagConnecting).toBe(true);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it("should check the Mu tag battery level", async (): Promise<void> => {
            discoveredPeripheralNotifier.next();
            await startAddingNewMuTagPromise;
            startScanCompleteNotifier.next();

            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                2,
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it("should add Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should add Mu tag to local persistence", (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should provision the Mu tag hardware", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);

            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                3,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Major,
                Hexadecimal.fromString("0000")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                4,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Minor,
                Hexadecimal.fromString("0005")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                5,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Provision,
                MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
            );

            expect(account.muTags.size).toBe(2);
            expect(account.newBeaconId).toEqual(BeaconId.create("A"));
            expect(account.newMuTagNumber).toEqual(
                validAccountData._nextMuTagNumber + 2
            );

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should set TX power to highest option (+6; 0x01)", (): void => {
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                7,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.TxPower,
                Hexadecimal.fromString("01")
            );
        });

        // Then
        //
        it("should show the remaining Mu tag setup screens", (): void => {
            expect(didShowMuTagFinalSetupScreen).toBe(true);
        });

        // When user completes Mu tag setup
        //
        // Then
        //
        it("should show activity indicator #2", async (): Promise<void> => {
            await addMuTagInteractor.completeMuTagSetup(muTagColorSetting);
            expect(didShowActivityIndicatorTimes).toBe(2);
        });

        // Then
        //
        it("should update Mu tag with new settings", (): void => {
            expect(muTagUpdateColorSpy).toHaveBeenCalledWith(muTagColorSetting);
            expect(muTagUpdateColorSpy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should update Mu tag to local persistence", (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(newMuTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        it("should update Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenLastCalledWith(
                newMuTag,
                validAccountData._uid,
                validAccountData._accountNumber
            );
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the home screen", (): void => {
            expect(didNavigateToHomeScreen).toBe(true);
        });
    });

    describe("Scenario 3: User cancels add Mu tag.", (): void => {
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
            (serviceUUIDs: string[], timeout: Millisecond) => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(), timeout);
                });
            }
        );

        // Given that an account is logged in

        // Given that user has requested to add unprovisioned Mu tag

        let didNavigateToHomeScreen = false;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                addMuTagViewModel.onNavigateToHomeScreen(
                    () => (didNavigateToHomeScreen = true)
                );
                // user requests to add unprovisioned Mu tag
                addMuTagInteractor.startAddingNewMuTag();
                // the user cancels add Mu tag
                await addMuTagInteractor.stopAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show home screen", (): void => {
            expect(didNavigateToHomeScreen).toBe(true);
        });

        // Then
        //
        it("should cancel connecting to new Mu tag", (): void => {
            expect(bluetoothMock.stopScan).toHaveBeenCalledTimes(1);
        });
    });

    describe("Scenario 4: Mu tag battery is below threshold.", (): void => {
        // Given that an account is logged in

        // Given the Mu tag battery is below threshold
        //
        const muTagBatteryLevelLow = new Percent(14);
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            muTagBatteryLevelLow
        );

        // Given unprovisioned Mu tag is connected
        //
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
            (serviceUUIDs: string[], timeout: Millisecond) => {
                discoveredPeripheralSubscriber.next(discoveredPeripheral);
                return new Promise(resolve => {
                    setTimeout(() => resolve(), timeout);
                });
            }
        );

        let didNavigateToHomeScreen = false;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                addMuTagViewModel.onNavigateToHomeScreen(
                    () => (didNavigateToHomeScreen = true)
                );
                // user requests to add unprovisioned Mu tag
                await addMuTagInteractor.startAddingNewMuTag();
                // Mu tag battery level is checked
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show message that the Mu tag battery is below threshold and needs to be charged before adding", (): void => {
            expect(addMuTagViewModel.userErrorDescription).toBe(
                "Unable to add Mu tag because its battery is below 15%. Please charge Mu tag and try again."
            );
            expect(addMuTagViewModel.showError).toBe(true);
        });

        // When user dismisses error message
        //
        // Then
        //
        it("should show the home screen", async (): Promise<void> => {
            // the user cancels add Mu tag
            await addMuTagInteractor.stopAddingNewMuTag();
            expect(didNavigateToHomeScreen).toBe(true);
        });
    });*/
});
