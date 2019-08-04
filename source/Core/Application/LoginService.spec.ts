import { LoginService, EmailAddress, Password } from './LoginService';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { Account } from '../Domain/Account';
import { Authentication, UserData } from '../Ports/Authentication';
import { LoginOutput } from '../Ports/LoginOutput';
import { AccountRepositoryLocalDb } from '../../Secondary Adapters/Persistence/AccountRepositoryLocalDb';
import { LocalDatabase } from '../../Secondary Adapters/Persistence/LocalDatabase';
/*jest.mock('../../Secondary Adapters/Persistence/AccountRepositoryRNAS');
const MockAccountRepositoryRNAS = AccountRepositoryRNAS as jest.Mock<AccountRepositoryRNAS>;*/

const showHomeScreenMock = jest.fn();
const showLoginErrorMock = jest.fn();

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

class LocalDatabaseExample implements LocalDatabase {

    private database: { [key: string]: string };

    constructor(database: { [key: string]: string }) {
        this.database = database;
    }

    async create(key: string, value: string): Promise<void> {
        this.database[key] = value;
    }

    async read(key: string): Promise<string> {
        const value = this.database[key];
        if (value == null) {
            throw Error('Key does not exist.');
        } else {
            return value;
        }
    }

    async update(key: string, value: string): Promise<void> {
        if (this.database.hasOwnProperty(key)) {
            this.database[key] = value;
        } else {
            throw Error('Key does not exist.');
        }
    }

    async delete(key: string): Promise<void> {
        if (this.database.hasOwnProperty(key)) {
            delete this.database[key];
        } else {
            throw Error('Key does not exist.');
        }
    }
}

class AccountRepositoryRemoteExample implements AccountRepositoryRemote {

    private readonly database: DatabaseExample;

    constructor(database: DatabaseExample) {
        this.database = database;
    }

    async getByUID(uid: string): Promise<Account> {
        if (!this.database.accounts.hasOwnProperty(uid)) {
            throw new Error('Account does not exist with this UID.');
        }

        const account = new Account(
            uid,
            this.database.accounts[uid].emailAddress,
        );

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
    [key: string]: any;
}

describe('user logs into their account', (): void => {

    describe('credentials are valid', (): void => {

        const loginPresenter = new LoginPresenterExample();
        const user = {
            uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
            emailAddress: 'support+test@informu.io',
            password: 'testPassword',
        };
        const authentication = new AuthenticationExample(user);
        const localDatabase = new LocalDatabaseExample({});
        const accountRepoLocal = new AccountRepositoryLocalDb(localDatabase);
        const remoteDatabase: { [key: string]: any } = {
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

        /*const accountRepositoryRNASMockInstance = MockAccountRepositoryRNAS.mock.instances[0];
        const addMock = accountRepositoryRNASMockInstance.add as jest.Mock;

        addMock.mockRejectedValue(new Error());
        addMock.mockResolvedValue();*/

        beforeAll(async (): Promise<void> => {
            await loginController.loginWithEmail(emailAddress, password);
        });

        it('should save account login locally', async (): Promise<void> => {
            const account = await accountRepoLocal.get();
            expect(account.uid).toEqual(user.uid);
            expect(account.emailAddress)
                .toEqual(remoteDatabase.accounts[user.uid].emailAddress);
        });

        it('should show Home screen', (): void => {
            expect(showHomeScreenMock.mock.calls.length).toEqual(1);
            expect(showLoginErrorMock.mock.calls.length).toEqual(0);
        });
    });
});