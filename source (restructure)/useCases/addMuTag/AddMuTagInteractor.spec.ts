import AddMuTagInteractorImpl from "./AddMuTagInteractor";
import Percent from "../../shared/metaLanguage/Percent";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import AddMuTagPresenter from "./presentation/AddMuTagPresenter";
import { AddMuTagViewModel } from "./presentation/AddMuTagViewModel";
import { NameMuTagViewModel } from "./presentation/NameMuTagViewModel";
import { MuTagAddingViewModel } from "./presentation/MuTagAddingViewModel";
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
import { take, skip, filter } from "rxjs/operators";
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

const addMuTagViewModel = new AddMuTagViewModel();
const nameMuTagViewModel = new NameMuTagViewModel();
const muTagAddingViewModel = new MuTagAddingViewModel();
const addMuTagPresenter = new AddMuTagPresenter(
    addMuTagViewModel,
    nameMuTagViewModel,
    muTagAddingViewModel
);

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
    addMuTagPresenter,
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

        // Given unprovisioned Mu tag is connected before user completes Mu tag naming

        // Given the Mu tag battery is above threshold
        //
        bluetoothReadReturnValue = new Percent(45);

        // Given Mu tag hardware provisions successfully

        let newMuTag: ProvisionedMuTag;

        const onAccountAddNewMuTag = new Subject<[string, BeaconId]>();
        const removeMuTagOriginal = account.removeMuTag.bind(account);
        const accountAddNewMuTagSpy = jest.spyOn(account, "addNewMuTag");
        accountAddNewMuTagSpy.mockImplementation((uid, beaconId) => {
            onAccountAddNewMuTag.next([uid, beaconId]);
            removeMuTagOriginal(uid, beaconId);
        });

        /*let muTagUpdateColorSpy: jest.SpyInstance<void, [MuTagColor]>;
        (muTagRepoLocalMock.add as jest.Mock).mockImplementationOnce(
            (addedMuTag: ProvisionedMuTag) => {
                newMuTag = addedMuTag;
                muTagUpdateColorSpy = jest.spyOn(newMuTag, "changeColor");
            }
        );
        const muTagColorSetting = MuTagColor.MuOrange;*/
        const muTagAddNewMuTagSpy = jest.spyOn(account, "addNewMuTag");

        const executionOrder: number[] = [];

        let onShowActivity;
        let onFindUnprovisioned;
        let onConnectUnprovisioned;
        let onVerifyBatteryLevel;
        let onAddMuTagRemotePersistence;
        let onAddMuTagLocalPersistence;
        let onAddMuTagToAccount;
        let onUpdateAccountRemotePersistence;
        let onUpdateAccountLocalPersistence;
        let onProvisionMuTag;
        let onSetTxPower;
        let onSetAdvertisingInterval;
        let onHideActivity;
        let onRequestName;
        let onShowActivity2;
        let onUpdateMuTagEntity;
        let onUpdateMuTagLocalPersistence;
        let onUpdateMuTagRemotePersistence;
        let onHideActivity2;
        let onShowSuccess;

        let startAddingNewMuTagPromise;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                addMuTagViewModel.onNavigateToNameMuTag(
                    () => (didNavigateToNameMuTag = true)
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

                onShowActivity;
                onStartScanSubscriber
                    .pipe(take(1))
                    .toPromise()
                    .then(subscriber => subscriber.next(discoveredPeripheral));
                onFindUnprovisioned = bluetoothMocks.onStartScan
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
                    .pipe(take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(9));
                onSetTxPower = bluetoothMocks.onWrite
                    .pipe(skip(1), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(10));
                onSetAdvertisingInterval = bluetoothMocks.onWrite
                    .pipe(skip(2), take(1))
                    .toPromise()
                    .finally(() => executionOrder.push(11));
                onHideActivity;
                onRequestName;
                onShowActivity2;
                onUpdateMuTagEntity;
                onUpdateMuTagLocalPersistence;
                onUpdateMuTagRemotePersistence;
                onHideActivity2;
                onShowSuccess;
                // user requests to add unprovisioned Mu tag
                startAddingNewMuTagPromise = addMuTagInteractor.startAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should show activity indicator.", async (): Promise<void> => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(nameMuTagViewModel.showActivityIndicator).toBe(true);
        });

        // Then
        //
        it("Should find unprovisioned Mu tag.", (): void => {});

        // Then
        //
        it("Should connect to unprovisioned Mu tag.", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should verify Mu tag battery level.", (): void => {
            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                2,
                discoveredPeripheral.id,
                MuTagBleGatt.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it("Should add Mu tag to remote persistence.", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should add Mu tag to local persistence.", (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should add Mu tag to account.", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should update account to remote persistence.", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should update account to local persistence.", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should provision Mu tag hardware.", (): void => {
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
                Hexadecimal.fromString("0002")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                5,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.Provision,
                MuTagBleGatt.MuTagConfiguration.Provision.provisionCode
            );

            expect(account.muTags.size).toBe(2);
            expect(account.newBeaconId).toEqual(recycledBeaconIds[1]);
            expect(account.newMuTagNumber).toEqual(
                validAccountData._nextMuTagNumber + 1
            );

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should set TX power to highest option 0x01 (+6dBm).", (): void => {
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                7,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.TxPower,
                Hexadecimal.fromString("01")
            );
        });

        // Then
        //
        it("Should set advertising interval to 0x03 (852ms).", (): void => {
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                8,
                discoveredPeripheral.id,
                MuTagBleGatt.MuTagConfiguration.AdvertisingInterval,
                Hexadecimal.fromString("03")
            );
        });

        // Then
        //
        it("Should hide activity indicator.", async (): Promise<void> => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(nameMuTagViewModel.showActivityIndicator).toBe(true);
        });

        // Then
        //
        it("Should request Mu tag name.", (): void => {
            addMuTagInteractor.instructionsComplete();
            expect(didNavigateToNameMuTag).toBe(true);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it("Should show activity indicator a second time.", async () => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(nameMuTagViewModel.showActivityIndicator).toBe(true);
        });

        // Then
        //
        it("Should update Mu tag with new settings.", (): void => {
            expect(muTagUpdateColorSpy).toHaveBeenCalledWith(muTagColorSetting);
            expect(muTagUpdateColorSpy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should update Mu tag to local persistence.", (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(newMuTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should update Mu tag to remote persistence.", (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenLastCalledWith(
                newMuTag,
                validAccountData._uid,
                validAccountData._accountNumber
            );
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("Should hide activity indicator a second time.", async () => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(nameMuTagViewModel.showActivityIndicator).toBe(true);
        });

        // Then
        //
        it("Should show success.", (): void => {
            expect(didNavigateToHomeScreen).toBe(true);
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
