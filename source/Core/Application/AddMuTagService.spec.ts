import AddMuTagService from './AddMuTagService';
import { Bluetooth } from '../Ports/Bluetooth';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import Percent from '../Domain/Percent';
import { RSSI } from '../Domain/Types';

describe('Mu tag user adds Mu tag', (): void => {

    const BluetoothMock
        = jest.fn<Bluetooth, any>((): Bluetooth => ({
            findNewMuTag: jest.fn(),
            connectToMuTag: jest.fn(),
            provisionMuTag: jest.fn(),
        }));

    const AddMuTagOutputMock
        = jest.fn<AddMuTagOutput, any>((): AddMuTagOutput => ({
            showAddMuTagScreen: jest.fn(),
            showMuTagSetupScreen: jest.fn(),
            showHomeScreen: jest.fn(),
            showLowBatteryError: jest.fn(),
            showAddMuTagTimeoutError: jest.fn(),
        }));

    const MuTagRepoLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            add: jest.fn(),
        }));

    const MuTagRepoRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            add: jest.fn(),
        }));

    const bluetoothMock = new BluetoothMock();
    const addMuTagOutputMock = new AddMuTagOutputMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();

    const findNewMuTagScanThreshold = -72 as RSSI;
    const addMuTagBatteryThreshold = new Percent(15);
    const addMuTagService = new AddMuTagService(
        findNewMuTagScanThreshold,
        addMuTagBatteryThreshold,
        addMuTagOutputMock,
        bluetoothMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
    );

    const muTagBatteryLevel = new Percent(16);
    const newUUID = 'randomUUID';
    const unprovisionedMuTag = new UnprovisionedMuTag(newUUID, muTagBatteryLevel);
    const newMuTagAttachedTo = 'keys';
    const muTag = new ProvisionedMuTag(newUUID, muTagBatteryLevel);

    describe('Mu tag adds successfully', (): void => {

        // Given that an account is logged in

        // Given unprovisioned Mu tag is connectable
        //
        (bluetoothMock.findNewMuTag as jest.Mock).mockResolvedValueOnce(unprovisionedMuTag);
        (bluetoothMock.connectToMuTag as jest.Mock).mockResolvedValueOnce(undefined);

        // Given the Mu tag battery is above threshold
        //
        const showLowBatteryErrorCalledTimes = 0;

        // Given Mu tag hardware doesn’t timeout
        //
        const showAddMuTagTimeoutErrorCalledTimes = 0;

        // Given Mu tag hardware provisions successfully
        //
        (bluetoothMock.provisionMuTag as jest.Mock).mockResolvedValueOnce(muTag);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user starts scanning for unprovisioned Mu tag
            await addMuTagService.connectToNewMuTag();
            // user adds the Mu tag
            await addMuTagService.addConnectedMuTag(newMuTagAttachedTo);
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
        it('should check the Mu tag battery level', (): void => {
            expect(bluetoothMock.findNewMuTag)
                .toHaveBeenCalledWith(findNewMuTagScanThreshold);
            expect(bluetoothMock.findNewMuTag).toHaveBeenCalledTimes(1);
            expect(bluetoothMock.connectToMuTag).toHaveBeenCalledWith(unprovisionedMuTag);
            expect(bluetoothMock.connectToMuTag).toHaveBeenCalledTimes(1);
            expect(addMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledTimes(showLowBatteryErrorCalledTimes);
        });

        // Then
        //
        it('should show the Mu tag setup screen', (): void => {
            expect(addMuTagOutputMock.showMuTagSetupScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should provision the Mu tag hardware', (): void => {
            expect(bluetoothMock.provisionMuTag).toHaveBeenCalledWith(unprovisionedMuTag);
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
        it('should show the home screen', (): void => {
            expect(addMuTagOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
            expect(addMuTagOutputMock.showAddMuTagTimeoutError)
                .toHaveBeenCalledTimes(showAddMuTagTimeoutErrorCalledTimes);
        });

        it('mu tag hardware should not have timed out', (): void => {
            expect(addMuTagOutputMock.showAddMuTagTimeoutError)
                .toHaveBeenCalledTimes(showAddMuTagTimeoutErrorCalledTimes);
        });
    });
});
