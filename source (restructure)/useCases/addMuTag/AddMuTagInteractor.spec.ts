import AddMuTagInteractor, { LowMuTagBattery } from "./AddMuTagInteractor";
import {
    MuTagDevicesPort,
    TXPowerSetting
} from "./MuTagDevicesPort";
import UnprovisionedMuTag from "../../../source/Core/Domain/UnprovisionedMuTag";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { AddMuTagOutputPort } from "./AddMuTagOutputPort";
import { MuTagRepositoryRemote } from "../../../source/Core/Ports/MuTagRepositoryRemote";
import { MuTagRepositoryLocal } from "../../../source/Core/Ports/MuTagRepositoryLocal";
import Percent from "../../shared/metaLanguage/Percent";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import Account, {
    AccountNumber,
    AccountData
} from "../../../source/Core/Domain/Account";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import { AccountRepositoryRemote } from "../../../source/Core/Ports/AccountRepositoryRemote";

describe("Mu tag user adds Mu tag", (): void => {
    const MuTagDevicesMock = jest.fn<MuTagDevicesPort, any>(
        (): MuTagDevicesPort => ({
            findNewMuTag: jest.fn(),
            cancelFindNewMuTag: jest.fn(),
            connectToProvisionedMuTag: jest.fn(),
            disconnectFromProvisionedMuTag: jest.fn(),
            provisionMuTag: jest.fn(),
            unprovisionMuTag: jest.fn(),
            readBatteryLevel: jest.fn(),
            changeTXPower: jest.fn()
        })
    );

    const AddMuTagOutputMock = jest.fn<AddMuTagOutputPort, any>(
        (): AddMuTagOutputPort => ({
            showAddMuTagScreen: jest.fn(),
            showMuTagNamingScreen: jest.fn(),
            showMuTagConnectingScreen: jest.fn(),
            showMuTagFinalSetupScreen: jest.fn(),
            showActivityIndicator: jest.fn(),
            showHomeScreen: jest.fn(),
            showError: jest.fn(),
            showLowBatteryError: jest.fn(),
            showFindNewMuTagError: jest.fn(),
            showProvisionFailedError: jest.fn(),
            showBluetoothUnsupportedError: jest.fn()
        })
    );

    const MuTagRepoLocalMock = jest.fn<MuTagRepositoryLocal, any>(
        (): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            getByBeaconID: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const MuTagRepoRemoteMock = jest.fn<MuTagRepositoryRemote, any>(
        (): MuTagRepositoryRemote => ({
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const AccountRepoLocalMock = jest.fn<AccountRepositoryLocal, any>(
        (): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        })
    );

    const AccountRepoRemoteMock = jest.fn<AccountRepositoryRemote, any>(
        (): AccountRepositoryRemote => ({
            getByUID: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const muTagDevicesMock = new MuTagDevicesMock();
    (muTagDevicesMock.cancelFindNewMuTag as jest.Mock).mockResolvedValue(
        undefined
    );
    const addMuTagOutputMock = new AddMuTagOutputMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    (muTagRepoLocalMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoLocalMock.update as jest.Mock).mockResolvedValue(undefined);
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
    (muTagRepoRemoteMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoRemoteMock.update as jest.Mock).mockResolvedValue(undefined);
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const accountRepoRemoteMock = new AccountRepoRemoteMock();

    const connectMuTagScanThreshold = -72 as Rssi;
    const addMuTagBatteryThreshold = new Percent(15);
    const addMuTagService = new AddMuTagInteractor(
        connectMuTagScanThreshold,
        addMuTagBatteryThreshold,
        addMuTagOutputMock,
        muTagDevicesMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        accountRepoLocalMock,
        accountRepoRemoteMock
    );

    const recycledBeaconIDs = [BeaconId.create("2"), BeaconId.create("5")];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _nextBeaconID: BeaconId.create("A"),
        _recycledBeaconIDs: new Set(recycledBeaconIDs),
        _nextMuTagNumber: 10,
        _muTags: new Set(["randomUUID#1"])
    };
    const account = new Account(validAccountData);
    const newBeaconIDSpy = jest.spyOn(account, "newBeaconID", "get");
    const newMuTagNumberSpy = jest.spyOn(account, "newMuTagNumber", "get");
    const addNewMuTagSpy = jest.spyOn(account, "addNewMuTag");

    const muTagBatteryLevel = new Percent(16);
    const newUUID = "randomUUID#2";
    const unprovisionedMuTag = new UnprovisionedMuTag(
        newUUID,
        muTagBatteryLevel
    );
    const isBatteryAboveSpy = jest.spyOn(
        unprovisionedMuTag,
        "isBatteryAboveThreshold"
    );
    const newMuTagAttachedTo = "keys";
    const muTagColorSetting = MuTagColor.Scarlet;
    const muTagIsSafe = true;
    const muTagLastSeen = new Date();
    const muTag = new ProvisionedMuTag({
        _uid: newUUID,
        _beaconID: recycledBeaconIDs[0],
        _muTagNumber: validAccountData._nextMuTagNumber,
        _name: newMuTagAttachedTo,
        _batteryLevel: muTagBatteryLevel,
        _isSafe: muTagIsSafe,
        _lastSeen: muTagLastSeen,
        _color: muTagColorSetting
    });
    const muTagUpdateColorSpy = jest.spyOn(muTag, "changeColor");

    describe("Mu tag adds successfully", (): void => {
        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected before user completes Mu tag naming
        //
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(
            unprovisionedMuTag
        );

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        const newMuTagBeaconID = recycledBeaconIDs[0];
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (accountRepoLocalMock.update as jest.Mock).mockResolvedValueOnce(
            undefined
        );
        (muTagDevicesMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(
            muTag
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user requests to add unprovisioned Mu tag
                await addMuTagService.startAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show instructions for adding Mu tag", (): void => {
            expect(addMuTagOutputMock.showAddMuTagScreen).toHaveBeenCalledTimes(
                1
            );
        });

        // Then
        //
        it("should attempt connection to unprovisioned Mu tag", (): void => {
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledWith(
                connectMuTagScanThreshold
            );
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledTimes(1);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(isBatteryAboveSpy).toHaveBeenCalledWith(
                addMuTagBatteryThreshold
            );
            expect(isBatteryAboveSpy).toHaveBeenCalledTimes(1);
            expect(
                addMuTagOutputMock.showLowBatteryError
            ).toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // When user completes instructions for adding Mu tag
        //
        // Then
        //
        it("should show Mu tag naming screen", (): void => {
            addMuTagService.instructionsComplete();
            expect(
                addMuTagOutputMock.showMuTagNamingScreen
            ).toHaveBeenCalledTimes(1);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it("should show activity indicator", async (): Promise<void> => {
            await addMuTagService.setMuTagName(newMuTagAttachedTo);
            expect(
                addMuTagOutputMock.showActivityIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should provision the Mu tag hardware", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);

            expect(newBeaconIDSpy).toHaveBeenCalledTimes(1);
            expect(newMuTagNumberSpy).toHaveBeenCalledTimes(1);

            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledWith(
                unprovisionedMuTag,
                validAccountData._accountNumber,
                newMuTagBeaconID,
                validAccountData._nextMuTagNumber,
                newMuTagAttachedTo
            );
            //expect(muTagDevicesMock.provisionMuTag).resolves.toEqual(muTag);
            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledTimes(1);

            expect(addNewMuTagSpy).toHaveBeenCalledWith(
                newUUID,
                newMuTagBeaconID
            );
            expect(addNewMuTagSpy).toHaveBeenCalledTimes(1);
            expect(account.newBeaconID).toEqual(recycledBeaconIDs[1]);
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
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledWith(
                validAccountData._accountNumber,
                newMuTagBeaconID
            );
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledTimes(1);
            expect(muTagDevicesMock.changeTXPower).toHaveBeenCalledWith(
                TXPowerSetting["+6 dBm"],
                validAccountData._accountNumber,
                newMuTagBeaconID
            );
            expect(muTagDevicesMock.changeTXPower).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should add Mu tag to local persistence", (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should add Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(
                muTag,
                validAccountData._uid
            );
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the remaining Mu tag setup screens", (): void => {
            expect(
                addMuTagOutputMock.showMuTagFinalSetupScreen
            ).toHaveBeenCalledTimes(1);
        });

        // When user completes Mu tag setup
        //
        // Then
        //
        it("should show activity indicator #2", async (): Promise<void> => {
            await addMuTagService.completeMuTagSetup(muTagColorSetting);
            expect(
                addMuTagOutputMock.showActivityIndicator
            ).toHaveBeenCalledTimes(2);
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
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        it("should update Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(
                muTag,
                validAccountData._uid
            );
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the home screen", (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe("Mu tag adds successfully after connection delay", (): void => {
        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected after user completes Mu tag naming
        //
        const userEntersMuTagNameAfter = 1000 as Millisecond;
        const muTagConnectsAfter = 2000 as Millisecond;
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockImplementationOnce(
            (): Promise<UnprovisionedMuTag> => {
                return new Promise((resolve): void => {
                    setTimeout(
                        (): void => resolve(unprovisionedMuTag),
                        muTagConnectsAfter
                    );
                });
            }
        );

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        const newMuTagBeaconID = recycledBeaconIDs[1];
        const newMuTagNumber = validAccountData._nextMuTagNumber + 1;
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (accountRepoLocalMock.update as jest.Mock).mockResolvedValueOnce(
            undefined
        );
        (muTagDevicesMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(
            muTag
        );

        let startAddingNewMuTagPromise: Promise<void>;
        // When
        //
        beforeAll((): void => {
            jest.useFakeTimers();

            // user requests to add unprovisioned Mu tag
            startAddingNewMuTagPromise = addMuTagService.startAddingNewMuTag();
        });

        afterAll((): void => {
            jest.clearAllMocks();
            jest.useRealTimers();
        });

        // Then
        //
        it("should show instructions for adding Mu tag", (): void => {
            expect(addMuTagOutputMock.showAddMuTagScreen).toHaveBeenCalledTimes(
                1
            );
        });

        // Then
        //
        it("should attempt connection to unprovisioned Mu tag", (): void => {
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledWith(
                connectMuTagScanThreshold
            );
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledTimes(1);
        });

        // When user completes instructions for adding Mu tag
        //
        // Then
        //
        it("should show Mu tag naming screen", (): void => {
            addMuTagService.instructionsComplete();
            expect(
                addMuTagOutputMock.showMuTagNamingScreen
            ).toHaveBeenCalledTimes(1);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it("should show Mu tag connecting screen", async (): Promise<void> => {
            jest.advanceTimersByTime(userEntersMuTagNameAfter);

            // This is require after all 'jest.advanceTimersByTime' calls
            // https://stackoverflow.com/questions/52673682/how-do-i-test-promise-delays-with-jest
            await Promise.resolve();

            await addMuTagService.setMuTagName(newMuTagAttachedTo);
            expect(
                addMuTagOutputMock.showMuTagConnectingScreen
            ).toHaveBeenCalledTimes(1);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it("should check the Mu tag battery level", async (): Promise<void> => {
            jest.advanceTimersByTime(
                muTagConnectsAfter - userEntersMuTagNameAfter
            );
            await startAddingNewMuTagPromise;

            expect(isBatteryAboveSpy).toHaveBeenCalledWith(
                addMuTagBatteryThreshold
            );
            expect(isBatteryAboveSpy).toHaveBeenCalledTimes(1);
            expect(
                addMuTagOutputMock.showLowBatteryError
            ).toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // Then
        //
        it("should provision the Mu tag hardware", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);

            expect(newBeaconIDSpy).toHaveBeenCalledTimes(1);
            expect(newMuTagNumberSpy).toHaveBeenCalledTimes(1);

            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledWith(
                unprovisionedMuTag,
                validAccountData._accountNumber,
                newMuTagBeaconID,
                newMuTagNumber,
                newMuTagAttachedTo
            );
            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledTimes(1);

            expect(addNewMuTagSpy).toHaveBeenCalledWith(
                newUUID,
                newMuTagBeaconID
            );
            expect(addNewMuTagSpy).toHaveBeenCalledTimes(1);
            expect(account.newBeaconID).toEqual(validAccountData._nextBeaconID);
            expect(account.newMuTagNumber).toEqual(newMuTagNumber + 1);

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should add Mu tag to local persistence", (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should add Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(
                muTag,
                validAccountData._uid
            );
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the remaining Mu tag setup screens", (): void => {
            expect(
                addMuTagOutputMock.showMuTagFinalSetupScreen
            ).toHaveBeenCalledTimes(1);
        });

        // When user completes Mu tag setup
        //
        // Then
        //
        it("should show activity indicator #2", async (): Promise<void> => {
            await addMuTagService.completeMuTagSetup(muTagColorSetting);

            expect(
                addMuTagOutputMock.showActivityIndicator
            ).toHaveBeenCalledTimes(2);
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
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        it("should update Mu tag to remote persistence", (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(
                muTag,
                validAccountData._uid
            );
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the home screen", (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe("user cancels add Mu tag", (): void => {
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(
            unprovisionedMuTag
        );

        // Given that an account is logged in

        // Given that user has requested to add unprovisioned Mu tag

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user requests to add unprovisioned Mu tag
                await addMuTagService.startAddingNewMuTag();
                // the user cancels add Mu tag
                await addMuTagService.stopAddingNewMuTag();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show home screen", (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should cancel connecting to new Mu tag", (): void => {
            expect(muTagDevicesMock.cancelFindNewMuTag).toHaveBeenCalledTimes(
                1
            );
        });
    });

    describe("Mu tag battery is below threshold", (): void => {
        // Given that an account is logged in

        // Given the Mu tag battery is below threshold
        //
        const muTagBatteryLevelLow = new Percent(15);
        const unprovisionedMuTagLowBatt = new UnprovisionedMuTag(
            newUUID,
            muTagBatteryLevelLow
        );

        // Given unprovisioned Mu tag is connected
        //
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(
            unprovisionedMuTagLowBatt
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user requests to add unprovisioned Mu tag
                await addMuTagService.startAddingNewMuTag();
                // Mu tag battery level is checked
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show message that the Mu tag battery is below threshold and needs to be charged before adding", (): void => {
            expect(addMuTagOutputMock.showLowBatteryError).toHaveBeenCalledWith(
                new LowMuTagBattery(addMuTagBatteryThreshold.valueOf())
            );
            expect(
                addMuTagOutputMock.showLowBatteryError
            ).toHaveBeenCalledTimes(1);
        });

        // When user dismisses error message
        //
        // Then
        //
        it("should show the home screen", async (): Promise<void> => {
            // the user cancels add Mu tag
            await addMuTagService.stopAddingNewMuTag();
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });
});
