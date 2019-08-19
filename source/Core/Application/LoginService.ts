import { LoginOutput } from '../Ports/LoginOutput';
import { Authentication, InvalidCredentials, AccountDisabled, AuthenticationException, TooManyAttempts } from '../Ports/Authentication';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import {
    DoesNotExist,
    FailedToGet,
    FailedToAdd,
    FailedToRemove,
    AccountRepositoryLocalException,
    AccountRepositoryLocal,
} from '../Ports/AccountRepositoryLocal';

export class ImproperEmailFormat extends Error {

    constructor() {
        super('This is not a proper email address.');
        this.name = 'ImproperEmailFormat';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ImproperPasswordComplexity extends Error {

    constructor() {
        super('Password doesn\'t meet complexity requirements.');
        this.name = 'ImproperPasswordComplexity';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type LoginServiceException
    = ImproperEmailFormat | ImproperPasswordComplexity;

export class LoginService {

    private readonly loginOutput: LoginOutput;
    private readonly authentication: Authentication;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;

    constructor(
        loginOutput: LoginOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote
    ) {
        this.loginOutput = loginOutput;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
    }

    async logInWithEmail(emailAddress: EmailAddress, password: Password): Promise<void> {
        if (!emailAddress.isValid()) {
            this.loginOutput.showLoginError(new ImproperEmailFormat());

            return;
        }

        if (!password.isValid()) {
            this.loginOutput.showLoginError(new ImproperPasswordComplexity());

            return;
        }

        this.loginOutput.showBusyIndicator();

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
            if (
                this.isLoginServiceException(e)
                || this.isAuthenticationException(e)
                || this.isAccountRepositoryLocalException(e)
            ) {
                this.loginOutput.showLoginError(e);
            } else {
                throw e;
            }
        }
    }

    private isLoginServiceException(
        value: any
    ): value is LoginServiceException {
        return value instanceof ImproperEmailFormat
            || value instanceof ImproperPasswordComplexity;
    }

    private isAuthenticationException(
        value: any
    ): value is AuthenticationException {
        return value instanceof InvalidCredentials
            || value instanceof AccountDisabled
            || value instanceof TooManyAttempts;
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
        const regexp = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}/;

        return regexp.test(this.emailAddress);
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
        // Regex for no spaces at beginning or end of string
        const regexpOne = /^\S$|^\S[ \S]*\S$/;
        const testOne = regexpOne.test(this.password);

        const symbols = '!-/:-@\\[-`{-~';

        /*  This should allow any Unicode letter. RegExp currently doesn't
            support '\p{L}'.
        */
        const anyLetter = `[^${symbols}\\d]`;

        const letterOrNumber = `(${anyLetter}|\\d)`;
        const letterOrSymbol = `(${anyLetter}|[${symbols}])`;
        const numberOrSymbol = `(\\d|[${symbols}])`;

        const regexTwo
            = `^(?=.*${letterOrNumber})(?=.*${letterOrSymbol})(?=.*${numberOrSymbol}).{8,}$`;
        const regexpTwo = new RegExp(regexTwo);
        const testTwo = regexpTwo.test(this.password);

        return testOne && testTwo;
    }

    rawValue(): string {
        return this.password;
    }
}