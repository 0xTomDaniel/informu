import LogoutService from './LogoutService';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import Account, { AccountNumber, AccountData } from '../Domain/Account';
import { LogoutOutput } from '../Ports/LogoutOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { RepositoryLocal } from '../Ports/RepositoryLocal';
import { MuTagColor } from '../Domain/MuTag';

describe('user logs out of their account', (): void => {

    const LogoutOutputMock
        = jest.fn<LogoutOutput, any>((): LogoutOutput => ({
            showBusyIndicator: jest.fn(),
            showLogoutComplete: jest.fn(),
        }));

    const AccountRepositoryLocalMock
        = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        }));

    const AccountRepositoryRemoteMock
        = jest.fn<AccountRepositoryRemote, any>((): AccountRepositoryRemote => ({
            getByUID: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const MuTagRepositoryLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            getByBeaconID: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const MuTagRepositoryRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const RepoLocalMock
        = jest.fn<RepositoryLocal, any>((): RepositoryLocal => ({
            erase: jest.fn(),
        }));

    const logoutOutputMock = new LogoutOutputMock();
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const accountRepoRemoteMock = new AccountRepositoryRemoteMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const muTagRepoRemoteMock = new MuTagRepositoryRemoteMock();
    const repoLocalMock = new RepoLocalMock();
    const logoutService = new LogoutService(
        logoutOutputMock,
        accountRepoLocalMock,
        accountRepoRemoteMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        repoLocalMock,
    );

    const recycledBeaconIDs = [
        BeaconID.create('2'),
        BeaconID.create('5'),
    ];
    const accountMuTags = ['randomUUID1', 'randomUUID2'];
    const validAccountData: AccountData = {
        _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        _accountNumber: AccountNumber.create('0000000'),
        _emailAddress: 'support+test@informu.io',
        _nextBeaconID: BeaconID.create('A'),
        _recycledBeaconIDs: new Set(recycledBeaconIDs),
        _nextMuTagNumber: 15,
        _muTags: new Set(accountMuTags),
    };
    const account = new Account(validAccountData);
    const muTag1 = new ProvisionedMuTag({
        _uid: 'randomUUID1',
        _beaconID: BeaconID.fromString('0'),
        _muTagNumber: 0,
        _name: 'keys',
        _batteryLevel: new Percent(80),
        _isSafe: true,
        _lastSeen: new Date(),
        _color: MuTagColor.MuOrange,
    });
    const muTag2 = new ProvisionedMuTag({
        _uid: 'randomUUID2',
        _beaconID: BeaconID.fromString('1'),
        _muTagNumber: 1,
        _name: 'laptop',
        _batteryLevel: new Percent(80),
        _isSafe: true,
        _lastSeen: new Date(),
        _color: MuTagColor.MuOrange,
    });
    const muTags = new Set([muTag1, muTag2]);

    describe('user is logged in', (): void => {

        // Given that an account is logged in
        //
        (accountRepoLocalMock.get as jest.Mock)
            .mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getAll as jest.Mock)
            .mockResolvedValueOnce(muTags);

        let onResetAllDependenciesCalledTimes = 0;

        // When the user submits log out
        //
        beforeAll(async (): Promise<void> => {
            logoutService.onResetAllDependencies((): void => {
                onResetAllDependenciesCalledTimes++;
            });
            await logoutService.logOut();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show activity indicator', (): void => {
            expect(logoutOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should save all local account data to remote persistence', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.getAll).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.updateMultiple).toHaveBeenCalledWith(muTags, validAccountData._uid);
            expect(muTagRepoRemoteMock.updateMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should delete all local persistence', (): void => {
            expect(repoLocalMock.erase).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should reset all dependencies', (): void => {
            expect(onResetAllDependenciesCalledTimes).toEqual(1);
        });

        // Then
        //
        it('should show login option', (): void => {
            expect(logoutOutputMock.showLogoutComplete).toHaveBeenCalledTimes(1);
        });
    });
});
