import AddMuTagInteractor from "./AddMuTagInteractor";
import Percent from "../../shared/metaLanguage/Percent";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import AddMuTagPresenter from "./presentation/AddMuTagPresenter";
import { HomeViewModel } from "../../../source/Primary Adapters/Presentation/HomeViewModel";
import { AddMuTagViewModel } from "./presentation/AddMuTagViewModel";
import { NameMuTagViewModel } from "./presentation/NameMuTagViewModel";
import { MuTagAddingViewModel } from "./presentation/MuTagAddingViewModel";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import Bluetooth, {
    Peripheral,
    ManufacturerData,
    PeripheralId
} from "../../shared/muTagDevices/Bluetooth";
import { Observable, Subscriber } from "rxjs";
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
import { MuTagBLEGATT } from "../../shared/muTagDevices/MuTagBLEGATT/MuTagBLEGATT";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import lolex from "lolex";

const addMuTagConnectThreshold = -72 as Rssi;
const addMuTagBatteryThreshold = new Percent(15);
const homeViewModel = new HomeViewModel();
const addMuTagViewModel = new AddMuTagViewModel();
const nameMuTagViewModel = new NameMuTagViewModel();
const muTagAddingViewModel = new MuTagAddingViewModel();
const addMuTagPresenter = new AddMuTagPresenter(
    homeViewModel,
    addMuTagViewModel,
    nameMuTagViewModel,
    muTagAddingViewModel
);
let discoveredPeripheralSubscriber: Subscriber<Peripheral>;
const discoveredPeripheralObservable = new Observable<Peripheral>(
    subscriber => {
        discoveredPeripheralSubscriber = subscriber;
    }
);
const BluetoothMock = jest.fn<Bluetooth, any>(
    (): Bluetooth => ({
        discoveredPeripheral: discoveredPeripheralObservable,
        startScan: jest.fn(),
        stopScan: jest.fn(),
        retrieveServices: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        read: jest.fn(),
        write: jest.fn(),
        enableBluetooth: jest.fn()
    })
);
const bluetoothMock = new BluetoothMock();
const muTagDevices = new MuTagDevices(bluetoothMock);
const MuTagRepoLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        add: jest.fn(),
        update: jest.fn(),
        removeByUid: jest.fn()
    })
);
const MuTagRepoRemoteMock = jest.fn<MuTagRepositoryRemotePort, any>(
    (): MuTagRepositoryRemotePort => ({
        add: jest.fn(),
        update: jest.fn(),
        createNewUid: jest.fn(),
        removeByUid: jest.fn()
    })
);
const AccountRepoLocalMock = jest.fn<AccountRepositoryLocalPort, any>(
    (): AccountRepositoryLocalPort => ({
        get: jest.fn(),
        update: jest.fn()
    })
);
const AccountRepoRemoteMock = jest.fn<AccountRepositoryRemotePort, any>(
    (): AccountRepositoryRemotePort => ({
        update: jest.fn()
    })
);
const muTagRepoLocalMock = new MuTagRepoLocalMock();
const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
const accountRepoLocalMock = new AccountRepoLocalMock();
const accountRepoRemoteMock = new AccountRepoRemoteMock();
const addMuTagInteractor = new AddMuTagInteractor(
    addMuTagConnectThreshold,
    addMuTagBatteryThreshold,
    addMuTagPresenter,
    muTagDevices,
    muTagRepoLocalMock,
    muTagRepoRemoteMock,
    accountRepoLocalMock,
    accountRepoRemoteMock
);

describe("Mu tag user adds Mu tag", (): void => {
    (bluetoothMock.retrieveServices as jest.Mock).mockResolvedValue({});
    (bluetoothMock.stopScan as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.connect as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.disconnect as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.write as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.enableBluetooth as jest.Mock).mockResolvedValue(undefined);
    const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _name: "Taylor Black",
        _nextBeaconId: BeaconId.create("A"),
        _nextSafeZoneNumber: 1,
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _nextMuTagNumber: 10,
        _onboarding: false,
        _muTags: new Set(["randomUUID01"])
    };
    const account = new Account(validAccountData);
    (accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);
    (accountRepoLocalMock.update as jest.Mock).mockResolvedValue(undefined);
    (accountRepoRemoteMock.update as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoLocalMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoLocalMock.update as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoRemoteMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoRemoteMock.update as jest.Mock).mockResolvedValue(undefined);

    const manufacturerDataJson =
        "[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
    const manufacturerDataBytes = new Uint8Array(
        JSON.parse(manufacturerDataJson)
    );
    const manufacturerDataBase64 =
        "AgEGGv9MAAIV3n7H7RBVsFXA3t7+p+36fv////+2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const manufacturerData: ManufacturerData = {
        bytes: manufacturerDataBytes,
        data: manufacturerDataBase64,
        cdvType: "ArrayBuffer"
    };
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

    describe("Mu tag adds successfully", (): void => {
        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected before user completes Mu tag naming
        //
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
            (serviceUUIDs: string[], timeout: Millisecond) => {
                discoveredPeripheralSubscriber.next(discoveredPeripheral);
                return new Promise(resolve => {
                    setTimeout(() => resolve(), timeout);
                });
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

        let didNavigateToAddMuTag = false;
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(undefined);
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            muTagBatteryLevel
        );
        let didNavigateToNameMuTag = false;
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
                homeViewModel.onNavigateToAddMuTag(() => {
                    didNavigateToAddMuTag = true;
                });
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

                // user requests to add unprovisioned Mu tag
                await addMuTagInteractor.startAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show instructions for adding Mu tag", (): void => {
            expect(didNavigateToAddMuTag).toBe(true);
        });

        // Then
        //
        it("should attempt connection to unprovisioned Mu tag", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(1);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                2,
                discoveredPeripheral.id,
                MuTagBLEGATT.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(2);
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
        it("should show activity indicator", async (): Promise<void> => {
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(nameMuTagViewModel.showActivityIndicator).toBe(true);
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
                MuTagBLEGATT.MuTagConfiguration.Major,
                Hexadecimal.fromString("0000")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                4,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.Minor,
                Hexadecimal.fromString("0002")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                5,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.provisionCode
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
        it("should set TX power to highest option (+6; 0x01)", (): void => {
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                7,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.TxPower,
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

    describe("Mu tag adds successfully after connection delay", (): void => {
        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected after user completes Mu tag naming
        //
        const userEntersMuTagNameAfter = 1000 as Millisecond;
        const muTagConnectsAfter = 2000 as Millisecond;
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
            (serviceUUIDs: string[], timeout: Millisecond) => {
                return new Promise(resolve => {
                    setTimeout(
                        () =>
                            discoveredPeripheralSubscriber.next(
                                discoveredPeripheral
                            ),
                        muTagConnectsAfter
                    );
                    setTimeout(() => resolve(), timeout);
                });
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

        let didNavigateToAddMuTag = false;
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

        let clock: lolex.InstalledClock<lolex.Clock>;

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                homeViewModel.onNavigateToAddMuTag(
                    () => (didNavigateToAddMuTag = true)
                );
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
                clock = lolex.install();
                // user requests to add unprovisioned Mu tag
                startAddingNewMuTagPromise = addMuTagInteractor.startAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
            clock.uninstall();
        });

        // Then
        //
        it("should show instructions for adding Mu tag", (): void => {
            expect(didNavigateToAddMuTag).toBe(true);
        });

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
            clock.tick(userEntersMuTagNameAfter);
            await addMuTagInteractor.setMuTagName(newMuTagName);
            expect(didNavigateToMuTagConnecting).toBe(true);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it("should check the Mu tag battery level", async (): Promise<void> => {
            clock.tick(muTagConnectsAfter - userEntersMuTagNameAfter);
            await startAddingNewMuTagPromise;

            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                2,
                discoveredPeripheral.id,
                MuTagBLEGATT.DeviceInformation.BatteryLevel
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
                MuTagBLEGATT.MuTagConfiguration.Major,
                Hexadecimal.fromString("0000")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                4,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.Minor,
                Hexadecimal.fromString("0005")
            );
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                5,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.provisionCode
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
                MuTagBLEGATT.MuTagConfiguration.TxPower,
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

    describe("user cancels add Mu tag", (): void => {
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

    describe("Mu tag battery is below threshold", (): void => {
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
    });
});
