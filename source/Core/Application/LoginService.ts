import { LoginOutput } from '../Ports/LoginOutput';
import { Authentication } from '../Ports/Authentication';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import {
    DoesNotExist,
    FailedToGet,
    FailedToAdd,
    FailedToRemove,
    AccountRepositoryLocalException,
    AccountRepositoryLocal,
} from '../Ports/AccountRepositoryLocal';

export class LoginService {

    private readonly loginOutput: LoginOutput;
    private readonly authentication: Authentication;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;

    constructor(
        loginAdapter: LoginOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote
    ) {
        this.loginOutput = loginAdapter;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
    }

    async logInWithEmail(emailAddress: EmailAddress, password: Password): Promise<void> {
        if (!emailAddress.isValid) {
            const error = new Error('Email address is not formatted correctly.');
            this.loginOutput.showLoginError(error);

            return;
        }

        if (!password.isValid) {
            const error = new Error('Password doesn\'t meet complexity requirements.');
            this.loginOutput.showLoginError(error);

            return;
        }

        try {
            const userData = await this.authentication.authenticateWithEmail(
                emailAddress.rawValue(),
                password.rawValue()
            );
            const account = await this.accountRepoRemote.getByUID(userData.uid);

            // TODO: Load and save Mu tags, Safe Zones, etc.

            await this.accountRepoLocal.add(account);

            this.loginOutput.showHomeScreen();
        } catch (e) {
            if (this.isAccountRepositoryLocalException(e)) {
                this.loginOutput.showLoginError(e);
            } else {
                throw e;
            }
        }
    }

    private isAccountRepositoryLocalException(
        value: any
    ): value is AccountRepositoryLocalException {
        return value instanceof DoesNotExist
            || value instanceof FailedToGet
            || value instanceof FailedToAdd
            || value instanceof FailedToRemove;
    }
}

export class EmailAddress {

    private readonly emailAddress: string;

    constructor(emailAddress: string) {
        this.emailAddress = emailAddress;
    }

    isValid(): boolean {
        /*const regexp = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}/;

        return regexp.test(this.emailAddress);*/

        return true;
    }

    rawValue(): string {
        return this.emailAddress;
    }
}

export class Password {

    private readonly password: string;

    constructor(password: string) {
        this.password = password;
    }

    isValid(): boolean {
        /*const letterOrNumber = '(\p{L}|\p{N})';
        const letterOrSymbol = '(\p{L}|[^\p{L}\p{N}])';
        const numberOrSymbol = '(\p{N}|[^\p{L}\p{N}])';
        const regex
            = `^(?=.*${letterOrNumber})(?=.*${letterOrSymbol})(?=.*${numberOrSymbol})[\S]{8,}$`;
        const regexp = new RegExp(regex);

        return regexp.test(this.password);*/

        return true;
    }

    rawValue(): string {
        return this.password;
    }
}
