import LogoutService from './LogoutService';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import Account, { AccountNumber } from '../Domain/Account';
import { LogoutOutput } from '../Ports/LogoutOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { RepositoryLocal } from '../Ports/RepositoryLocal';

describe('user logs out of their account', (): void => {

    /*const LogoutOutputMock
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
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const MuTagRepositoryRemoteMock
        = jest.fn<MuTagRepositoryRemote, any>((): MuTagRepositoryRemote => ({
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
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

    const validAccountData = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        accountNumber: AccountNumber.create('0000000'),
        emailAddress: 'support+test@informu.io',
        nextBeaconID: BeaconID.create('A'),
        recycledBeaconIDs: [
            BeaconID.create('2'),
            BeaconID.create('5'),
        ],
        nextMuTagNumber: 15,
        muTags: ['randomUUID1', 'randomUUID2'],
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
    const muTag1 = new ProvisionedMuTag(
        'randomUUID1',
        BeaconID.fromString('0'),
        0,
        'keys',
        new Percent(80)
    );
    const muTag2 = new ProvisionedMuTag(
        'randomUUID1',
        BeaconID.fromString('1'),
        1,
        'laptop',
        new Percent(80)
    );
    const muTags = new Set([muTag1, muTag2]);*/

    describe('mobile device detects Mu tag beacon', (): void => {

        // Given that the account connected to the current Mu tag is logged in

        // Given app device is in range of Mu tag beacon

        // When the app device detects Mu tag beacon


        beforeAll(async (): Promise<void> => {
            await logoutService.logOut();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('', (): void => {
            expect().toHaveBeenCalledTimes(1);
        });
    });
});
