import { LoginService, EmailAddress, Password } from './LoginService';
import { AccountRepository } from '../Ports/AccountRepository';
import { Account } from '../Domain/Account';
import { Authentication, UserData } from '../Ports/Authentication';
import { LoginOutput } from '../Ports/LoginOutput';

describe('user logs into their account', (): void => {
    const showHomeScreenMock = jest.fn();
    const showLoginErrorMock = jest.fn();

    /* Instead of mocking actual implementations for testing, example
     * implementations were created so that any changes outside of the
     * application core will not effect tests.
     */

    class LoginControllerExample {

        private readonly loginService: LoginService;

        constructor(loginService: LoginService) {
            this.loginService = loginService;
        }

        async loginWithEmail(emailAddress: string, password: string): Promise<void> {
            const emailInstance = new EmailAddress(emailAddress);
            const passwordInstance = new Password(password);

            return this.loginService.logInWithEmail(emailInstance, passwordInstance);
        }
    }

    class LoginPresenterExample implements LoginOutput {
        showHomeScreen(): void {
            showHomeScreenMock();
        }

        showLoginError(error: Error): void {
            showLoginErrorMock(error);
        }
    }

    class AuthenticationExample implements Authentication {

        private readonly user: UserExample;

        constructor(user: UserExample) {
            this.user = user;
        }

        async authenticateWithEmail(
            emailAddress: string,
            password: string
        ): Promise<UserData> {
            if (emailAddress !== this.user.emailAddress) {
                throw new Error('Account doesn\'t exist with this email address.');
            }

            if (password !== this.user.password) {
                throw new Error('Invalid password for this user.');
            }

            const userData = {
                uid: this.user.uid,
                emailAddress: this.user.emailAddress,
            };

            return Promise.resolve(userData);
        }
    }

    interface UserExample {
        uid: string;
        emailAddress: string;
        password: string;
    }

    class AccountRepositoryLocalExample implements AccountRepository {

        private readonly database: DatabaseExample;

        constructor(database: DatabaseExample) {
            this.database = database;
        }

        async getByUID(uid: string): Promise<Account> {
            if (!this.database.accounts.hasOwnProperty(uid)) {
                throw new Error('Account does not exist with this UID.');
            }

            const account = new Account({
                uid: uid,
                emailAddress: this.database.accounts[uid].emailAddress,
            });

            return Promise.resolve(account);
        }

        async add(account: Account): Promise<void> {
            this.database.accounts[account.uid] = {
                emailAddress: account.emailAddress,
            };

            return Promise.resolve();
        }
    }

    class AccountRepositoryRemoteExample implements AccountRepository {

        private readonly database: DatabaseExample;

        constructor(database: DatabaseExample) {
            this.database = database;
        }

        async getByUID(uid: string): Promise<Account> {
            if (!this.database.accounts.hasOwnProperty(uid)) {
                throw new Error('Account does not exist with this UID.');
            }

            const account = new Account({
                uid: uid,
                emailAddress: this.database.accounts[uid].emailAddress,
            });

            return Promise.resolve(account);
        }

        async add(account: Account): Promise<void> {
            this.database.accounts[account.uid] = {
                emailAddress: account.emailAddress,
            };

            return Promise.resolve();
        }
    }

    interface DatabaseExample {
        accounts: {
            [uid: string]: {
                emailAddress: string;
            };
        };
    }

    beforeEach((): void => {
        showHomeScreenMock.mockClear();
        showLoginErrorMock.mockClear();
    });

    describe('credentials are valid', (): void => {
        const loginPresenter = new LoginPresenterExample();
        const user = {
            uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
            emailAddress: 'support+test@informu.io',
            password: 'testPassword',
        };
        const authentication = new AuthenticationExample(user);
        const localDatabase = {
            accounts: {},
        };
        const accountRepoLocal = new AccountRepositoryLocalExample(localDatabase);
        const remoteDatabase = {
            accounts: {
                AZeloSR9jCOUxOWnf5RYN14r2632: {
                    emailAddress: 'support+test@informu.io',
                },
            },
        };
        const accountRepoRemote = new AccountRepositoryRemoteExample(remoteDatabase);
        const loginService = new LoginService(
            loginPresenter,
            authentication,
            accountRepoLocal,
            accountRepoRemote
        );
        const loginController = new LoginControllerExample(loginService);
        const emailAddress = 'support+test@informu.io';
        const password = 'testPassword';

        it('should show Home screen', async (): Promise<void> => {
            await loginController.loginWithEmail(emailAddress, password);

            expect(showHomeScreenMock.mock.calls.length).toEqual(1);
            expect(showLoginErrorMock.mock.calls.length).toEqual(0);
        });
    });
});
