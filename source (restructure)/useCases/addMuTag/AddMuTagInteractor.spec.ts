import {
    AddMuTagInteractorImpl,
    LowMuTagBattery,
    NewMuTagNotFound,
    FailedToNameMuTag,
    FailedToAddMuTag,
    FindNewMuTagCanceled
} from "./AddMuTagInteractor";
import Percent from "../../shared/metaLanguage/Percent";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import BluetoothPort, {
    Peripheral,
    PeripheralId,
    ScanMode,
    BluetoothError
} from "../../shared/bluetooth/BluetoothPort";
import {
    Observable,
    Subscriber,
    Subject,
    BehaviorSubject,
    EmptyError
} from "rxjs";
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
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import { Buffer } from "buffer";
import { take, skip, filter, takeLast, toArray } from "rxjs/operators";
import BluetoothAndroidDecorator from "../../shared/bluetooth/BluetoothAndroidDecorator";
import {
    WritableCharacteristic,
    ReadableCharacteristic
} from "../../shared/bluetooth/Characteristic";
import UserError from "../../shared/metaLanguage/UserError";
import { fakeSchedulers } from "rxjs-marbles/jest";
import { FindUnprovisionedMuTagTimeout } from "../../shared/muTagDevices/MuTagDevicesPort";

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
                    timeoutId = setTimeout(
                        () => subscriber.error(BluetoothError.ScanTimeout),
                        timeout
                    );
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

let muTagRepoRemoteAddError: Error | undefined;
let muTagRepoRemoteUpdateError: Error | undefined;
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
            return muTagRepoRemoteAddError == null
                ? Promise.resolve()
                : Promise.reject(muTagRepoRemoteAddError);
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
            return muTagRepoRemoteUpdateError == null
                ? Promise.resolve()
                : Promise.reject(muTagRepoRemoteUpdateError);
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

describe("User adds Mu tag.", () => {
    describe("Scenario 1: Mu tag adds successfully.", () => {
        // Given that an account is logged in

        // Given the Mu tag battery is above threshold

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
        beforeAll(async () => {
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
            bluetoothReadReturnValue = new Percent(45);
            // user requests to find unprovisioned Mu tag
            findNewMuTagPromise = addMuTagInteractor.findNewMuTag();
        });

        afterAll(() => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should find unprovisioned Mu tag.", async () => {
            expect.assertions(5);
            await expect(onFindUnprovisioned).resolves.toStrictEqual([
                [],
                5000,
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
            expect.assertions(3);
            await expect(onSetTxPower).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.TxPower,
                Hexadecimal.fromString("01")
            ]);
            expect(newMuTag.json._txPower).toBe(1);
            expect(executionOrder[10]).toBe(10);
        });

        // Then
        //
        it("Should set advertising interval to 0x03 (852ms).", async () => {
            expect.assertions(3);
            await expect(onSetAdvertisingInterval).resolves.toStrictEqual([
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
                Hexadecimal.fromString("03")
            ]);
            expect(newMuTag.json._advertisingInterval).toBe(3);
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

    describe("Scenario 2: User cancels finding Mu tag.", () => {
        // Given that an account is logged in

        // Given that user has requested to find unprovisioned Mu tag

        let onStopFindUnprovisioned: Promise<void>;

        let findNewMuTagPromise: Promise<void>;
        let stopFindingNewMuTagPromise: Promise<void>;

        // When
        //
        beforeAll(async () => {
            onStopFindUnprovisioned = bluetoothMocks.onStopScan
                .pipe(take(1))
                .toPromise();

            const onFindUnprovisioned = bluetoothMocks.onStartScan
                .pipe(take(1))
                .toPromise();
            findNewMuTagPromise = addMuTagInteractor.findNewMuTag();
            await onFindUnprovisioned;
            // the user cancels finding Mu tag
            stopFindingNewMuTagPromise = addMuTagInteractor.stopFindingNewMuTag();
        });

        afterAll(() => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should stop finding new Mu tag.", async () => {
            expect.assertions(3);
            await expect(onStopFindUnprovisioned).resolves.toBeUndefined();
            await expect(stopFindingNewMuTagPromise).resolves.toBeUndefined();
            const originatingError = new EmptyError();
            const canceledError = UserError.create(
                FindNewMuTagCanceled,
                originatingError
            );
            await expect(findNewMuTagPromise).rejects.toStrictEqual(
                canceledError
            );
        });
    });

    describe("Scenario 3: Mu tag battery is below threshold.", () => {
        // Given that an account is logged in

        // Given that the unprovisioned Mu tag is found

        // Given that the Mu tag battery is below threshold

        let onDisconnect: Promise<PeripheralId>;

        let addFoundMuTagPromise: Promise<void>;

        // When
        //
        beforeAll(async () => {
            onStartScanSubscriber
                .pipe(take(1))
                .toPromise()
                .then(subscriber => subscriber.next(discoveredPeripheral));

            onDisconnect = bluetoothMocks.onDisconnect
                .pipe(take(1))
                .toPromise();

            bluetoothReadReturnValue = new Percent(14);
            await addMuTagInteractor.findNewMuTag();
            // user requests to add Mu tag
            addFoundMuTagPromise = addMuTagInteractor.addFoundMuTag();
        });

        afterAll(() => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should close Bluetooth connection.", async () => {
            expect.assertions(1);
            await expect(onDisconnect).resolves.toBe(discoveredPeripheral.id);
        });

        // Then
        //
        it("Should produce low Mu tag battery error.", async () => {
            expect.assertions(1);
            await expect(addFoundMuTagPromise).rejects.toStrictEqual(
                UserError.create(
                    LowMuTagBattery(addMuTagBatteryThreshold.valueOf())
                )
            );
        });
    });

    describe("Scenario 4: Mu tag not found before timeout.", () => {
        // Given that the unprovisioned Mu tag is not found

        let findNewMuTagPromise: Promise<void>;

        // When
        //
        beforeAll(async () => {
            jest.useFakeTimers("modern");
            findNewMuTagPromise = addMuTagInteractor.findNewMuTag();
        });

        afterAll(() => {
            jest.clearAllMocks();
            jest.useRealTimers();
        });

        // Then
        //
        it(
            "Should produce Mu tag not found error.",
            fakeSchedulers(async advance => {
                expect.assertions(1);
                advance(30000);
                const originatingError01 = BluetoothError.ScanTimeout;
                const originatingError02 = UserError.create(
                    FindUnprovisionedMuTagTimeout,
                    originatingError01
                );
                await expect(findNewMuTagPromise).rejects.toStrictEqual(
                    UserError.create(NewMuTagNotFound, originatingError02)
                );
            })
        );
    });

    describe("Scenario 5: Fails to add Mu tag.", () => {
        // Given that the unprovisioned Mu tag is found

        // Given that the Mu tag battery is above threshold

        let addFoundMuTagPromise: Promise<void>;

        // When
        //
        beforeAll(async () => {
            onStartScanSubscriber
                .pipe(take(1))
                .toPromise()
                .then(subscriber => subscriber.next(discoveredPeripheral));

            bluetoothReadReturnValue = new Percent(15);
            await addMuTagInteractor.findNewMuTag();
            muTagRepoRemoteAddError = Error(
                "Failed to add Mu tag on remote repo."
            );
            // user requests to add Mu tag
            addFoundMuTagPromise = addMuTagInteractor.addFoundMuTag();
        });

        afterAll(() => {
            jest.clearAllMocks();
            muTagRepoRemoteAddError = undefined;
        });

        // Then
        //
        it("Should produce failed to add Mu tag error.", async () => {
            expect.assertions(1);
            await expect(addFoundMuTagPromise).rejects.toStrictEqual(
                UserError.create(FailedToAddMuTag, muTagRepoRemoteAddError)
            );
        });
    });

    describe("Scenario 6: Fails to name Mu tag.", () => {
        // Given that the unprovisioned Mu tag is found

        // Given that the Mu tag battery is above threshold

        let setMuTagNamePromise: Promise<void>;

        // When
        //
        beforeAll(async () => {
            onStartScanSubscriber
                .pipe(take(1))
                .toPromise()
                .then(subscriber => subscriber.next(discoveredPeripheral));

            bluetoothReadReturnValue = new Percent(15);
            await addMuTagInteractor.findNewMuTag();
            await addMuTagInteractor.addFoundMuTag();
            muTagRepoRemoteUpdateError = Error(
                "Failed to update Mu tag on remote repo."
            );
            // user requests to name Mu tag
            setMuTagNamePromise = addMuTagInteractor.setMuTagName(newMuTagName);
        });

        afterAll(() => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should produce failed to name Mu tag error.", async () => {
            expect.assertions(1);
            await expect(setMuTagNamePromise).rejects.toStrictEqual(
                UserError.create(FailedToNameMuTag, muTagRepoRemoteUpdateError)
            );
        });
    });
});
