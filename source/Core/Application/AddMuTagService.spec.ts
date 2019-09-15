import AddMuTagService from './AddMuTagService';
import { Bluetooth } from '../Ports/Bluetooth';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import Percent from '../Domain/Percent';
import { RSSI, Millisecond } from '../Domain/Types';
import { MuTagColor } from '../Domain/MuTag';

describe('Mu tag user adds Mu tag', (): void => {

    const BluetoothMock
        = jest.fn<Bluetooth, any>((): Bluetooth => ({
            connectToNewMuTag: jest.fn(),
            cancelConnectToNewMuTag: jest.fn(),
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
        }));

    const MuTagRepoLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            add: jest.fn(),
            update: jest.fn(),
        }));

    const MuTagRepoRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            add: jest.fn(),
            update: jest.fn(),
        }));

    const bluetoothMock = new BluetoothMock();
    const addMuTagOutputMock = new AddMuTagOutputMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();

    const connectMuTagScanThreshold = -72 as RSSI;
    const addMuTagBatteryThreshold = new Percent(15);
    const addMuTagService = new AddMuTagService(
        connectMuTagScanThreshold,
        addMuTagBatteryThreshold,
        addMuTagOutputMock,
        bluetoothMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
    );

    const muTagBatteryLevel = new Percent(16);
    const newUUID = 'randomUUID';
    const unprovisionedMuTag = new UnprovisionedMuTag(newUUID, muTagBatteryLevel);
    const isBatteryAboveSpy = jest.spyOn(unprovisionedMuTag, 'isBatteryAbove');
    const newMuTagAttachedTo = 'keys';
    const muTag = new ProvisionedMuTag(newUUID, muTagBatteryLevel);
    const muTagUpdateColorSpy = jest.spyOn(muTag, 'updateColor');
    const muTagColorSetting = MuTagColor.Scarlet;

    describe('Mu tag adds successfully', (): void => {

        // Given that an account is logged in

        // Given unprovisioned Mu tag is connected before user completes Mu tag naming
        //
        (bluetoothMock.connectToNewMuTag as jest.Mock).mockResolvedValueOnce(unprovisionedMuTag);

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        (bluetoothMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(muTag);

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
            expect(bluetoothMock.connectToNewMuTag)
                .toHaveBeenCalledWith(connectMuTagScanThreshold);
            expect(bluetoothMock.connectToNewMuTag).toHaveBeenCalledTimes(1);
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
            expect(bluetoothMock.provisionMuTag).toHaveBeenCalledWith(unprovisionedMuTag, newMuTagAttachedTo);
            //expect(bluetoothMock.provisionMuTag).resolves.toEqual(muTag);
            expect(bluetoothMock.provisionMuTag).toHaveBeenCalledTimes(1);
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
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(muTag);
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
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(muTag);
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
        (bluetoothMock.connectToNewMuTag as jest.Mock).mockImplementationOnce(
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
        (bluetoothMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(muTag);

        // When
        //
        beforeAll((): void => {
            jest.useFakeTimers();

            // user requests to add unprovisioned Mu tag
            addMuTagService.startAddingNewMuTag();
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
            expect(bluetoothMock.connectToNewMuTag)
                .toHaveBeenCalledWith(connectMuTagScanThreshold);
            expect(bluetoothMock.connectToNewMuTag).toHaveBeenCalledTimes(1);
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
            await Promise.resolve();

            expect(isBatteryAboveSpy).toHaveBeenCalledWith(addMuTagBatteryThreshold);
            expect(isBatteryAboveSpy).toHaveBeenCalledTimes(1);
            expect(addMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // Then
        //
        it('should provision the Mu tag hardware', async (): Promise<void> => {
            // This test must be async to wait for 'bluetoothMock.provisionMuTag'
            // and remaining promises to resolve
            expect(bluetoothMock.provisionMuTag).toHaveBeenCalledWith(unprovisionedMuTag, newMuTagAttachedTo);
            expect(bluetoothMock.provisionMuTag).toHaveBeenCalledTimes(1);
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
            expect(muTagRepoRemoteMock.add).toHaveBeenCalledWith(muTag);
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
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledWith(muTag);
            expect(muTagRepoRemoteMock.update).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the home screen', (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe('user cancels add Mu tag', (): void => {

        // Given that an account is logged in

        // Given that user has requested to add unprovisioned Mu tag

        // When
        //
        beforeAll((): void => {
            // user requests to add unprovisioned Mu tag
            addMuTagService.startAddingNewMuTag();
            // the user cancels add Mu tag
            addMuTagService.stopAddingNewMuTag();
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
            expect(bluetoothMock.cancelConnectToNewMuTag).toHaveBeenCalledTimes(1);
        });
    });
});
