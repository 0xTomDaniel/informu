import AddMuTagService, { LowMuTagBattery } from './AddMuTagService';
import { MuTagDevices } from '../Ports/MuTagDevices';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import Percent from '../Domain/Percent';
import { RSSI, Millisecond } from '../Domain/Types';
import { MuTagColor } from '../Domain/MuTag';
import Account, { AccountNumber } from '../Domain/Account';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';

describe('Mu tag user adds Mu tag', (): void => {

    const MuTagDevicesMock
        = jest.fn<MuTagDevices, any>((): MuTagDevices => ({
            findNewMuTag: jest.fn(),
            cancelFindNewMuTag: jest.fn(),
            provisionMuTag: jest.fn(),
        }));

    const AddMuTagOutputMock
        = jest.fn<AddMuTagOutput, any>((): AddMuTagOutput => ({
            showAddMuTagScreen: jest.fn(),
            showMuTagNamingScreen: jest.fn(),
            showMuTagConnectingScreen: jest.fn(),
            showMuTagFinalSetupScreen: jest.fn(),
            showActivityIndicator: jest.fn(),
            showHomeScreen: jest.fn(),
            showLowBatteryError: jest.fn(),
            showFindNewMuTagError: jest.fn(),
            showProvisionFailedError: jest.fn(),
        }));

    const MuTagRepoLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const MuTagRepoRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            add: jest.fn(),
            update: jest.fn(),
        }));

    const AccountRepoLocalMock
        = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        }));

    const AccountRepoRemoteMock
        = jest.fn<AccountRepositoryRemote, any>((): AccountRepositoryRemote => ({
            getByUID: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const muTagDevicesMock = new MuTagDevicesMock();
    (muTagDevicesMock.cancelFindNewMuTag as jest.Mock).mockResolvedValue(undefined);
    const addMuTagOutputMock = new AddMuTagOutputMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    (muTagRepoLocalMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoLocalMock.update as jest.Mock).mockResolvedValue(undefined);
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
    (muTagRepoRemoteMock.add as jest.Mock).mockResolvedValue(undefined);
    (muTagRepoRemoteMock.update as jest.Mock).mockResolvedValue(undefined);
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const accountRepoRemoteMock = new AccountRepoRemoteMock();

    const connectMuTagScanThreshold = -72 as RSSI;
    const addMuTagBatteryThreshold = new Percent(15);
    const addMuTagService = new AddMuTagService(
        connectMuTagScanThreshold,
        addMuTagBatteryThreshold,
        addMuTagOutputMock,
        muTagDevicesMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        accountRepoLocalMock,
        accountRepoRemoteMock,
    );

    const validAccountData = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        accountNumber: AccountNumber.create('0000000'),
        emailAddress: 'support+test@informu.io',
        nextBeaconID: BeaconID.create('A'),
        recycledBeaconIDs: [
            BeaconID.create('2'),
            BeaconID.create('5'),
        ],
        nextMuTagNumber: 10,
        muTags: ['randomUUID#1'],
    };
    const account = new Account(
        validAccountData.uid,
        validAccountData.accountNumber,
        validAccountData.emailAddress,
        validAccountData.nextBeaconID,
        validAccountData.recycledBeaconIDs,
        validAccountData.nextMuTagNumber,
        validAccountData.muTags,
    );
    const getNewBeaconIDSpy = jest.spyOn(account, 'getNewBeaconID');
    const getNewMuTagNumberSpy = jest.spyOn(account, 'getNewMuTagNumber');
    const addNewMuTagSpy = jest.spyOn(account, 'addNewMuTag');

    const muTagBatteryLevel = new Percent(16);
    const newUUID = 'randomUUID#2';
    const unprovisionedMuTag = new UnprovisionedMuTag(newUUID, muTagBatteryLevel);
    const isBatteryAboveSpy = jest.spyOn(unprovisionedMuTag, 'isBatteryAbove');
    const newMuTagAttachedTo = 'keys';
    const muTagColorSetting = MuTagColor.Scarlet;
    const muTag = new ProvisionedMuTag(
        newUUID,
        validAccountData.recycledBeaconIDs[0],
        validAccountData.nextMuTagNumber,
        newMuTagAttachedTo,
        muTagBatteryLevel,
        muTagColorSetting,
    );
    const muTagUpdateColorSpy = jest.spyOn(muTag, 'updateColor');

    describe('Mu tag adds successfully', (): void => {

        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected before user completes Mu tag naming
        //
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(unprovisionedMuTag);

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        const newMuTagBeaconID = validAccountData.recycledBeaconIDs[0];
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (accountRepoLocalMock.update as jest.Mock).mockResolvedValueOnce(undefined);
        (muTagDevicesMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(muTag);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user requests to add unprovisioned Mu tag
            await addMuTagService.startAddingNewMuTag();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show instructions for adding Mu tag', (): void => {
            expect(addMuTagOutputMock.showAddMuTagScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should attempt connection to unprovisioned Mu tag', (): void => {
            expect(muTagDevicesMock.findNewMuTag)
                .toHaveBeenCalledWith(connectMuTagScanThreshold);
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledTimes(1);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it('should check the Mu tag battery level', (): void => {
            expect(isBatteryAboveSpy).toHaveBeenCalledWith(addMuTagBatteryThreshold);
            expect(isBatteryAboveSpy).toHaveBeenCalledTimes(1);
            expect(addMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // When user completes instructions for adding Mu tag
        //
        // Then
        //
        it('should show Mu tag naming screen', (): void => {
            addMuTagService.instructionsComplete();
            expect(addMuTagOutputMock.showMuTagNamingScreen).toHaveBeenCalledTimes(1);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it('should show activity indicator', async (): Promise<void> => {
            await addMuTagService.setMuTagName(newMuTagAttachedTo);
            expect(addMuTagOutputMock.showActivityIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should provision the Mu tag hardware', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);

            expect(getNewBeaconIDSpy).toHaveBeenCalledTimes(1);
            expect(getNewMuTagNumberSpy).toHaveBeenCalledTimes(1);

            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledWith(
                unprovisionedMuTag,
                validAccountData.accountNumber,
                newMuTagBeaconID,
                validAccountData.nextMuTagNumber,
                newMuTagAttachedTo,
            );
            //expect(muTagDevicesMock.provisionMuTag).resolves.toEqual(muTag);
            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledTimes(1);

            expect(addNewMuTagSpy).toHaveBeenCalledWith(
                newUUID,
                newMuTagBeaconID,
            );
            expect(addNewMuTagSpy).toHaveBeenCalledTimes(1);
            expect(account.getNewBeaconID()).toEqual(validAccountData.recycledBeaconIDs[1]);
            expect(account.getNewMuTagNumber()).toEqual(validAccountData.nextMuTagNumber + 1);

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should add Mu tag to local persistence', (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should add Mu tag to remote persistence', (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(muTag, validAccountData.uid);
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the remaining Mu tag setup screens', (): void => {
            expect(addMuTagOutputMock.showMuTagFinalSetupScreen).toHaveBeenCalledTimes(1);
        });

        // When user completes Mu tag setup
        //
        // Then
        //
        it('should show activity indicator #2', async (): Promise<void> => {
            await addMuTagService.completeMuTagSetup(muTagColorSetting);
            expect(addMuTagOutputMock.showActivityIndicator).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it('should update Mu tag with new settings', (): void => {
            expect(muTagUpdateColorSpy).toHaveBeenCalledWith(muTagColorSetting);
            expect(muTagUpdateColorSpy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should update Mu tag to local persistence', (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        it('should update Mu tag to remote persistence', (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(muTag, validAccountData.uid);
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the home screen', (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe('Mu tag adds successfully after connection delay', (): void => {

        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected after user completes Mu tag naming
        //
        const userEntersMuTagNameAfter = 1000 as Millisecond;
        const muTagConnectsAfter = 2000 as Millisecond;
        (muTagDevicesMock.findNewMuTag as jest.Mock).mockImplementationOnce(
            (): Promise<UnprovisionedMuTag> => {
                return new Promise((resolve): void => {
                    setTimeout((): void => resolve(unprovisionedMuTag), muTagConnectsAfter);
                });
            }
        );

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        const newMuTagBeaconID = validAccountData.recycledBeaconIDs[1];
        const newMuTagNumber = validAccountData.nextMuTagNumber + 1;
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (accountRepoLocalMock.update as jest.Mock).mockResolvedValueOnce(undefined);
        (muTagDevicesMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(muTag);

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
        it('should show instructions for adding Mu tag', (): void => {
            expect(addMuTagOutputMock.showAddMuTagScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should attempt connection to unprovisioned Mu tag', (): void => {
            expect(muTagDevicesMock.findNewMuTag)
                .toHaveBeenCalledWith(connectMuTagScanThreshold);
            expect(muTagDevicesMock.findNewMuTag).toHaveBeenCalledTimes(1);
        });

        // When user completes instructions for adding Mu tag
        //
        // Then
        //
        it('should show Mu tag naming screen', (): void => {
            addMuTagService.instructionsComplete();
            expect(addMuTagOutputMock.showMuTagNamingScreen).toHaveBeenCalledTimes(1);
        });

        // When user enters Mu tag name
        //
        // Then
        //
        it('should show Mu tag connecting screen', async (): Promise<void> => {
            jest.advanceTimersByTime(userEntersMuTagNameAfter);

            // This is require after all 'jest.advanceTimersByTime' calls
            // https://stackoverflow.com/questions/52673682/how-do-i-test-promise-delays-with-jest
            await Promise.resolve();

            await addMuTagService.setMuTagName(newMuTagAttachedTo);
            expect(addMuTagOutputMock.showMuTagConnectingScreen).toHaveBeenCalledTimes(1);
        });

        // When unprovisioned Mu tag is connected
        //
        // Then
        //
        it('should check the Mu tag battery level', async (): Promise<void> => {
            jest.advanceTimersByTime(muTagConnectsAfter - userEntersMuTagNameAfter);
            await startAddingNewMuTagPromise;

            expect(isBatteryAboveSpy).toHaveBeenCalledWith(addMuTagBatteryThreshold);
            expect(isBatteryAboveSpy).toHaveBeenCalledTimes(1);
            expect(addMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // Then
        //
        it('should provision the Mu tag hardware', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);

            expect(getNewBeaconIDSpy).toHaveBeenCalledTimes(1);
            expect(getNewMuTagNumberSpy).toHaveBeenCalledTimes(1);

            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledWith(
                unprovisionedMuTag,
                validAccountData.accountNumber,
                newMuTagBeaconID,
                newMuTagNumber,
                newMuTagAttachedTo,
            );
            expect(muTagDevicesMock.provisionMuTag).toHaveBeenCalledTimes(1);

            expect(addNewMuTagSpy).toHaveBeenCalledWith(
                newUUID,
                newMuTagBeaconID,
            );
            expect(addNewMuTagSpy).toHaveBeenCalledTimes(1);
            expect(account.getNewBeaconID()).toEqual(validAccountData.nextBeaconID);
            expect(account.getNewMuTagNumber()).toEqual(newMuTagNumber + 1);

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should add Mu tag to local persistence', (): void => {
            expect(muTagRepoLocalMock.add).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should add Mu tag to remote persistence', (): void => {
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(muTag, validAccountData.uid);
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the remaining Mu tag setup screens', (): void => {
            expect(addMuTagOutputMock.showMuTagFinalSetupScreen).toHaveBeenCalledTimes(1);
        });

        // When user completes Mu tag setup
        //
        // Then
        //
        it('should show activity indicator #2', async (): Promise<void> => {
            await addMuTagService.completeMuTagSetup(muTagColorSetting);

            expect(addMuTagOutputMock.showActivityIndicator).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it('should update Mu tag with new settings', (): void => {
            expect(muTagUpdateColorSpy).toHaveBeenCalledWith(muTagColorSetting);
            expect(muTagUpdateColorSpy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should update Mu tag to local persistence', (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
        });

        it('should update Mu tag to remote persistence', (): void => {
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(muTag, validAccountData.uid);
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the home screen', (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe('user cancels add Mu tag', (): void => {

        (muTagDevicesMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(unprovisionedMuTag);

        // Given that an account is logged in

        // Given that user has requested to add unprovisioned Mu tag

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user requests to add unprovisioned Mu tag
            await addMuTagService.startAddingNewMuTag();
            // the user cancels add Mu tag
            await addMuTagService.stopAddingNewMuTag();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show home screen', (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should cancel connecting to new Mu tag', (): void => {
            expect(muTagDevicesMock.cancelFindNewMuTag).toHaveBeenCalledTimes(1);
        });
    });

    describe('Mu tag battery is below threshold', (): void => {

        // Given that an account is logged in

        // Given the Mu tag battery is below threshold
        //
        const muTagBatteryLevelLow = new Percent(15);
        const unprovisionedMuTagLowBatt = new UnprovisionedMuTag(newUUID, muTagBatteryLevelLow);

        // Given unprovisioned Mu tag is connected
        //
        (muTagDevicesMock.findNewMuTag as jest.Mock)
            .mockResolvedValueOnce(unprovisionedMuTagLowBatt);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user requests to add unprovisioned Mu tag
            await addMuTagService.startAddingNewMuTag();
            // Mu tag battery level is checked
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show message that the Mu tag battery is below threshold and needs to be charged before adding', (): void => {
            expect(addMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledWith(new LowMuTagBattery(addMuTagBatteryThreshold.valueOf()));
            expect(addMuTagOutputMock.showLowBatteryError).toHaveBeenCalledTimes(1);
        });

        // When user dismisses error message
        //
        // Then
        //
        it('should show the home screen', async (): Promise<void> => {
            // the user cancels add Mu tag
            await addMuTagService.stopAddingNewMuTag();
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });
});
