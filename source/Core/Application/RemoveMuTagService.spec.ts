import Percent from '../Domain/Percent';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import { MuTagDevices, MuTagNotFound, UnprovisionMuTagFailed } from '../Ports/MuTagDevices';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import Account, { AccountData, AccountNumber } from '../Domain/Account';
import { MuTagColor } from '../Domain/MuTag';
import RemoveMuTagService, { LowMuTagBattery } from './RemoveMuTagService';
import { RemoveMuTagOutput } from '../Ports/RemoveMuTagOutput';

describe('Mu tag user removes Mu tag', (): void => {

    const MuTagDevicesMock
        = jest.fn<MuTagDevices, any>((): MuTagDevices => ({
            findNewMuTag: jest.fn(),
            cancelFindNewMuTag: jest.fn(),
            provisionMuTag: jest.fn(),
            unprovisionMuTag: jest.fn(),
            readBatteryLevel: jest.fn(),
        }));

    const MuTagRepoLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            getByBeaconID: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const MuTagRepoRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
            removeByUID: jest.fn(),
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

    const RemoveMuTagOutputMock
        = jest.fn<RemoveMuTagOutput, any>((): RemoveMuTagOutput => ({
            showBusyIndicator: jest.fn(),
            hideBusyIndicator: jest.fn(),
            showMuTagNotFoundError: jest.fn(),
            showUnprovisionMuTagFailedError: jest.fn(),
            showLowBatteryError: jest.fn(),
            showUnknownError: jest.fn(),
        }));

    const muTagDevicesMock = new MuTagDevicesMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const accountRepoRemoteMock = new AccountRepoRemoteMock();
    const removeMuTagOutputMock = new RemoveMuTagOutputMock();

    const removeMuTagBatteryThreshold = new Percent(15);
    const removeMuTagService = new RemoveMuTagService(
        removeMuTagBatteryThreshold,
        muTagDevicesMock,
        accountRepoLocalMock,
        accountRepoRemoteMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        removeMuTagOutputMock,
    );

    const recycledBeaconIDs = [BeaconID.create('2'), BeaconID.create('5')];
    const validAccountData: AccountData = {
        _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        _accountNumber: AccountNumber.create('0000000'),
        _emailAddress: 'support+test@informu.io',
        _nextBeaconID: BeaconID.create('A'),
        _recycledBeaconIDs: new Set(recycledBeaconIDs),
        _nextMuTagNumber: 10,
        _muTags: new Set(['randomUUID#1']),
    };
    const account = new Account(validAccountData);
    const removeMuTagSpy = jest.spyOn(account, 'removeMuTag');

    const muTagUID = 'randomUUID#1';
    const beaconID = BeaconID.create('1');
    const muTagBatteryLevel = new Percent(17);
    const newMuTagAttachedTo = 'keys';
    const muTagColorSetting = MuTagColor.Scarlet;
    const muTagIsSafe = true;
    const muTagLastSeen = new Date();
    const muTag = new ProvisionedMuTag({
        _uid: muTagUID,
        _beaconID: beaconID,
        _muTagNumber: 1,
        _name: newMuTagAttachedTo,
        _batteryLevel: muTagBatteryLevel,
        _isSafe: muTagIsSafe,
        _lastSeen: muTagLastSeen,
        _color: muTagColorSetting,
    });

    describe('Mu tag removes successfully', (): void => {

        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable

        // Given the Mu tag battery is above threshold
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(new Percent(16));

        // Given Mu tag hardware unprovisions successfully
        //
        (muTagDevicesMock.unprovisionMuTag as jest.Mock).mockResolvedValueOnce(undefined);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user removes Mu tag
            await removeMuTagService.remove(muTagUID);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show busy indicator', (): void => {
            expect(removeMuTagOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should check the Mu tag battery level', (): void => {
            expect(muTagDevicesMock.readBatteryLevel).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should unprovision the Mu tag hardware', (): void => {
            expect(muTagDevicesMock.unprovisionMuTag).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should remove the Mu tag from local persistence', (): void => {
            expect(removeMuTagSpy).toHaveBeenCalledTimes(1);
            const _recycledBeaconIDs = account.json._recycledBeaconIDs;
            expect(_recycledBeaconIDs).toContain(beaconID.toString());

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.removeByUID).toHaveBeenCalledWith(muTagUID);
            expect(muTagRepoLocalMock.removeByUID).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should remove the Mu tag from remote persistence', (): void => {
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);

            expect(muTagRepoRemoteMock.removeByUID)
                .toHaveBeenCalledWith(muTagUID, validAccountData._uid);
            expect(muTagRepoRemoteMock.removeByUID).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should hide busy indicator', (): void => {
            expect(removeMuTagOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(1);
        });
    });

    describe('Mu tag is unconnectable (while reading battery level)', (): void => {

        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);

        // Given Mu tag is unconnectable
        //
        const muTagNoTFoundError = new MuTagNotFound();
        (muTagDevicesMock.readBatteryLevel as jest.Mock)
            .mockRejectedValueOnce(muTagNoTFoundError);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user removes Mu tag
            await removeMuTagService.remove(muTagUID);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show busy indicator', (): void => {
            expect(removeMuTagOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should hide busy indicator', (): void => {
            expect(removeMuTagOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show message to move Mu tag closer to mobile device, check Mu tag battery level, and try again', (): void => {
            expect(removeMuTagOutputMock.showMuTagNotFoundError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showMuTagNotFoundError)
                .toHaveBeenCalledWith(muTagNoTFoundError);
        });
    });

    describe('Mu tag is unconnectable (while unprovisioning)', (): void => {

        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);

        // Given Mu tag is unconnectable
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(new Percent(16));
        const muTagNoTFoundError = new MuTagNotFound();
        (muTagDevicesMock.unprovisionMuTag as jest.Mock)
            .mockRejectedValueOnce(muTagNoTFoundError);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user removes Mu tag
            await removeMuTagService.remove(muTagUID);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show busy indicator', (): void => {
            expect(removeMuTagOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should hide busy indicator', (): void => {
            expect(removeMuTagOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show message to move Mu tag closer to mobile device, check Mu tag battery level, and try again', (): void => {
            expect(removeMuTagOutputMock.showMuTagNotFoundError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showMuTagNotFoundError)
                .toHaveBeenCalledWith(muTagNoTFoundError);
        });
    });

    describe('Mu tag hardware fails to unprovision', (): void => {

        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);

        // Given Mu tag is connectable
        //
        // Given the Mu tag battery is above threshold
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(new Percent(16));

        // Given Mu tag hardware fails to unprovision
        //
        const unprovisionMuTagFailedError = new UnprovisionMuTagFailed();
        (muTagDevicesMock.unprovisionMuTag as jest.Mock)
            .mockRejectedValueOnce(unprovisionMuTagFailedError);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user removes Mu tag
            await removeMuTagService.remove(muTagUID);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show busy indicator', (): void => {
            expect(removeMuTagOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should check the Mu tag battery level', (): void => {
            expect(muTagDevicesMock.readBatteryLevel).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should hide busy indicator', (): void => {
            expect(removeMuTagOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show message that Mu tag failed to remove, to move closer to mobile device, and try again', (): void => {
            expect(removeMuTagOutputMock.showUnprovisionMuTagFailedError)
                .toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showUnprovisionMuTagFailedError)
                .toHaveBeenCalledWith(unprovisionMuTagFailedError);
        });
    });

    describe('Mu tag battery is below threshold', (): void => {

        // Given that the account connected to the current Mu tag is logged in

        // Given Mu tag is connectable
        //
        // Given the Mu tag battery is below threshold
        //
        const muTagBatteryLevelLow = new Percent(15);
        (muTagDevicesMock.readBatteryLevel as jest.Mock)
            .mockResolvedValueOnce(muTagBatteryLevelLow);

        // When
        //
        beforeAll(async (): Promise<void> => {
            // user removes Mu tag
            await removeMuTagService.remove(muTagUID);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show busy indicator', (): void => {
            expect(removeMuTagOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should hide busy indicator', (): void => {
            expect(removeMuTagOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show message that removal failed, Mu tag battery needs to be charged, and then try again', (): void => {
            expect(removeMuTagOutputMock.showLowBatteryError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showLowBatteryError)
                .toHaveBeenCalledWith(new LowMuTagBattery(removeMuTagBatteryThreshold.valueOf()));
        });
    });
});
