import { LoginService, EmailAddress, Password } from './LoginService';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { Account } from '../Domain/Account';
import { Authentication, UserData } from '../Ports/Authentication';
import { LoginOutput } from '../Ports/LoginOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';

describe('user logs into their account', (): void => {

    const LoginOutputMock
        = jest.fn<LoginOutput, any>((): LoginOutput => ({
            showHomeScreen: jest.fn(),
            showLoginError: jest.fn(),
        }));

    const AuthenticationMock
        = jest.fn<Authentication, any>((): Authentication => ({
            authenticateWithEmail: jest.fn(),
        }));

    const AccountRepositoryLocalMock
        = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
        }));

    const AccountRepositoryRemoteMock
        = jest.fn<AccountRepositoryRemote, any>((): AccountRepositoryRemote => ({
            getByUID: jest.fn(),
            add: jest.fn(),
            removeByUID: jest.fn(),
        }));

    const loginOutputMock = new LoginOutputMock();
    const authenticationMock = new AuthenticationMock();
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const accountRepoRemoteMock = new AccountRepositoryRemoteMock();
    const loginService = new LoginService(
        loginOutputMock,
        authenticationMock,
        accountRepoLocalMock,
        accountRepoRemoteMock
    );

    const validAccount = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        emailAddress: 'support+test@informu.io',
    };
    const validEmail = new EmailAddress('support+test@informu.io');
    const validPassword = new Password('testPassword!');

    describe('credentials are valid', (): void => {

        // Given that no account is logged in

        // Given credentials are valid for authentication
        //
        const userData: UserData = {
            uid: validAccount.uid,
            emailAddress: validAccount.emailAddress,
        };
        (authenticationMock.authenticateWithEmail as jest.Mock)
            .mockReturnValueOnce(Promise.resolve(userData));

        // Given an account exists for the provided credentials
        //
        const account = new Account(validAccount.uid, validAccount.emailAddress);
        (accountRepoRemoteMock.getByUID as jest.Mock)
            .mockReturnValueOnce(Promise.resolve(account));

        // When the user submits credentials
        //
        beforeAll(async (): Promise<void> => {
            await loginService.logInWithEmail(validEmail, validPassword);
        });

        // Then
        //
        it('should save account login locally', async (): Promise<void> => {
            expect(authenticationMock.authenticateWithEmail)
                .toHaveBeenCalledWith(validEmail.rawValue(), validPassword.rawValue());
            expect(authenticationMock.authenticateWithEmail).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledWith(userData.uid);
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledTimes(1);
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show Home screen', (): void => {
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showLoginError).toHaveBeenCalledTimes(0);
        });
    });
});
