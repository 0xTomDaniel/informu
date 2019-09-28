import Account, { AccountNumber } from '../Domain/Account';
import { Authentication } from '../Ports/Authentication';
import { AccountRepositoryLocal, DoesNotExist } from '../Ports/AccountRepositoryLocal';
import { SessionOutput } from '../Ports/SessionOutput';
import SessionService from './SessionService';
import { BeaconID } from '../Domain/ProvisionedMuTag';

describe('user opens saved login session', (): void => {

    const SessionOutputMock
        = jest.fn<SessionOutput, any>((): SessionOutput => ({
            showHomeScreen: jest.fn(),
            showLoginScreen: jest.fn(),
            showLoadSessionScreen: jest.fn(),
        }));

    const AuthenticationMock
        = jest.fn<Authentication, any>((): Authentication => ({
            authenticateWithEmail: jest.fn(),
            isAuthenticatedAs: jest.fn(),
        }));

    const AccountRepositoryLocalMock
        = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        }));

    const sessionOutputMock = new SessionOutputMock();
    const authenticationMock = new AuthenticationMock();
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const sessionService = new SessionService(
        sessionOutputMock,
        authenticationMock,
        accountRepoLocalMock
    );

    const validAccountData = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        accountNumber: AccountNumber.create('0000000'),
        emailAddress: 'support+test@informu.io',
        nextBeaconID: BeaconID.create('3'),
        recycledBeaconIDs: [BeaconID.create('1')],
    };
    const account = new Account(
        validAccountData.uid,
        validAccountData.accountNumber,
        validAccountData.emailAddress,
        validAccountData.nextBeaconID,
        validAccountData.recycledBeaconIDs,
    );

    describe('user is logged in with saved session', (): void => {

        // Given that an account is saved to local persistence
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);

        // Given that authentication session has not expired
        //
        (authenticationMock.isAuthenticatedAs as jest.Mock).mockResolvedValueOnce(true);

        // When the app is opened
        //
        beforeAll(async (): Promise<void> => {
            await sessionService.load();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show session loading screen', (): void => {
            expect(sessionOutputMock.showLoadSessionScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the home screen', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(authenticationMock.isAuthenticatedAs)
                .toHaveBeenCalledWith(validAccountData.uid);
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(0);
        });
    });

    describe('no account exists in local persistence', (): void => {

        // Given that no account exists in local persistence
        //
        (accountRepoLocalMock.get as jest.Mock).mockRejectedValueOnce(new DoesNotExist());

        // When the app is opened
        //
        beforeAll(async (): Promise<void> => {
            await sessionService.load();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show session loading screen', (): void => {
            expect(sessionOutputMock.showLoadSessionScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the login screen', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe('authentication session has expired', (): void => {

        // Given that an account is saved to local persistence
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);

        // Given that authentication session has expired
        //
        (authenticationMock.isAuthenticatedAs as jest.Mock).mockResolvedValueOnce(false);

        // When the app is opened
        //
        beforeAll(async (): Promise<void> => {
            await sessionService.load();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show session loading screen', (): void => {
            expect(sessionOutputMock.showLoadSessionScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should delete all local persistence', (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(authenticationMock.isAuthenticatedAs)
                .toHaveBeenCalledWith(validAccountData.uid);
            expect(accountRepoLocalMock.remove).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show the login screen', (): void => {
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(1);
        });
    });
});
