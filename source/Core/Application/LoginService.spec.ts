import {
    LoginService,
    EmailAddress,
    Password,
    ImproperEmailFormat,
    ImproperPasswordComplexity,
} from './LoginService';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { Account } from '../Domain/Account';
import { Authentication, UserData, InvalidCredentials } from '../Ports/Authentication';
import { LoginOutput } from '../Ports/LoginOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';

describe('user logs into their account', (): void => {

    const LoginOutputMock
        = jest.fn<LoginOutput, any>((): LoginOutput => ({
            showBusyIndicator: jest.fn(),
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

    const validAccountData = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        emailAddress: 'support+test@informu.io',
    };
    const account = new Account(validAccountData.uid, validAccountData.emailAddress);
    const validEmail = new EmailAddress('support+test@informu.io');
    const validPassword = new Password('testPassword!');

    describe('credentials are valid', (): void => {

        // Given that no account is logged in

        // Given credentials are valid for authentication
        //
        const userData: UserData = {
            uid: validAccountData.uid,
            emailAddress: validAccountData.emailAddress,
        };
        (authenticationMock.authenticateWithEmail as jest.Mock)
            .mockResolvedValueOnce(userData);

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUID as jest.Mock)
            .mockResolvedValueOnce(account);

        // When the user submits credentials
        //
        beforeAll(async (): Promise<void> => {
            await loginService.logInWithEmail(validEmail, validPassword);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show activity indicator', (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should save account login locally', (): void => {
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

    describe('credentials are invalid', (): void => {

        // Given that no account is logged in

        // Given credentials meet input validation requirements

        // Given credentials are invalid for authentication
        //
        const invalidPassword = new Password('testPassword@');
        (authenticationMock.authenticateWithEmail as jest.Mock)
            .mockRejectedValueOnce(new InvalidCredentials());

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUID as jest.Mock)
            .mockResolvedValueOnce(account);

        // When the user submits credentials
        //
        beforeAll(async (): Promise<void> => {
            await loginService.logInWithEmail(validEmail, invalidPassword);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show activity indicator', (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show a message that the log in attempt failed due to invalid credentials', (): void => {
            expect(loginOutputMock.showLoginError).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showLoginError)
                .toHaveBeenCalledWith(new InvalidCredentials());
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
        });
    });

    describe('credentials fail input validation', (): void => {

        describe('improper email address', (): void => {

            // Given that no account is logged in

            // Given credentials do not meet input validation requirements
            //
            const improperEmail = new EmailAddress('support+test.informu.io');

            // When the user submits credentials
            //
            beforeAll(async (): Promise<void> => {
                await loginService.logInWithEmail(improperEmail, validPassword);
            });

            afterAll((): void => {
                jest.clearAllMocks();
            });

            // Then
            //
            it('should show a message that an improper email address was entered', (): void => {
                expect(loginOutputMock.showLoginError).toHaveBeenCalledTimes(1);
                expect(loginOutputMock.showLoginError)
                    .toHaveBeenCalledWith(new ImproperEmailFormat());
                expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            });
        });

        describe('improper password complexity', (): void => {

            // Given that no account is logged in

            // Given credentials do not meet input validation requirements
            //
            const improperPassword = new Password('password');

            // When the user submits credentials
            //
            beforeAll(async (): Promise<void> => {
                await loginService.logInWithEmail(validEmail, improperPassword);
            });

            afterAll((): void => {
                jest.clearAllMocks();
            });

            // Then
            //
            it('should show a message that password doesn\'t meet complexity requirements', (): void => {
                expect(loginOutputMock.showLoginError).toHaveBeenCalledTimes(1);
                expect(loginOutputMock.showLoginError)
                    .toHaveBeenCalledWith(new ImproperPasswordComplexity());
                expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('account does not exist for email authentication', (): void => {

        // Given that no account is logged in

        // Given credentials meet input validation requirements
        //
        const newEmail = new EmailAddress('support+test2@informu.io');
        const newPassword = new Password('lollipops23');

        // Given an account does not exists for the provided credentials
        //
        (authenticationMock.authenticateWithEmail as jest.Mock)
            .mockRejectedValueOnce(new InvalidCredentials());

        // When the user submits credentials
        //
        beforeAll(async (): Promise<void> => {
            await loginService.logInWithEmail(newEmail, newPassword);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show activity indicator', (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it('should show a message that the log in attempt failed due to invalid credentials', (): void => {
            expect(loginOutputMock.showLoginError).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showLoginError)
                .toHaveBeenCalledWith(new InvalidCredentials());
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
        });
    });
});