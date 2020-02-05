import LoginOutput from "../Ports/LoginOutput";
import {
    Authentication,
    InvalidCredentials,
    UserDisabled,
    AuthenticationException,
    TooManyAttempts,
    GooglePlayServicesNotAvailable,
    GoogleSignInFailed,
    SignInCanceled,
    EmailNotFound,
    FacebookSignInFailed,
    IncorrectSignInMethod
} from "../Ports/Authentication";
import {
    AccountRepositoryRemote,
    DoesNotExist as AccountDoesNotExistOnRemote
} from "../Ports/AccountRepositoryRemote";
import {
    DoesNotExist as AccountDoesNotExistOnLocal,
    FailedToGet,
    FailedToAdd,
    FailedToRemove,
    AccountRepositoryLocalException,
    AccountRepositoryLocal
} from "../Ports/AccountRepositoryLocal";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import { Session } from "./SessionService";
import { AccountRegistration } from "./AccountRegistrationService";
import { UserData } from "../Ports/UserData";

export class ImproperEmailFormat extends Error {
    constructor() {
        super("This is not a proper email address.");
        this.name = "ImproperEmailFormat";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ImproperPasswordComplexity extends Error {
    constructor() {
        super("Password doesn't meet complexity requirements.");
        this.name = "ImproperPasswordComplexity";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type LoginServiceException =
    | ImproperEmailFormat
    | ImproperPasswordComplexity;

export class LoginService {
    private readonly loginOutput: LoginOutput;
    private readonly authentication: Authentication;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly sessionService: Session;
    private readonly accountRegistrationService: AccountRegistration;

    constructor(
        loginOutput: LoginOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        sessionService: Session,
        accountRegistrationService: AccountRegistration
    ) {
        this.loginOutput = loginOutput;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.sessionService = sessionService;
        this.accountRegistrationService = accountRegistrationService;
    }

    async signInWithEmail(
        emailAddress: EmailAddress,
        password: Password
    ): Promise<void> {
        try {
            if (!emailAddress.isValid()) {
                throw new ImproperEmailFormat();
            }
            if (!password.isValid()) {
                throw new ImproperPasswordComplexity();
            }
            this.loginOutput.showBusyIndicator();
            const userData = await this.authentication.authenticateWithEmail(
                emailAddress.rawValue(),
                password.rawValue()
            );
            await this.loadAccountFromRemote(userData.uid);
            await this.sessionService.start();
        } catch (e) {
            if (
                this.isLoginServiceException(e) ||
                this.isAuthenticationException(e) ||
                this.isAccountRepositoryLocalException(e)
            ) {
                this.loginOutput.showEmailLoginError(e);
            } else {
                throw e;
            }
        } finally {
            this.loginOutput.hideBusyIndicator();
        }
    }

    async signInWithFacebook(): Promise<void> {
        this.loginOutput.showBusyIndicator();
        this.sessionService.pauseLoadOnce();
        try {
            const userData = await this.authentication.authenticateWithFacebook();
            await this.loadOrCreateAccount(userData);
            await this.sessionService.start();
        } catch (e) {
            if (
                e instanceof FacebookSignInFailed ||
                e instanceof EmailNotFound ||
                e instanceof IncorrectSignInMethod
            ) {
                this.loginOutput.showFederatedLoginError(e);
            } else if (e instanceof SignInCanceled) {
                return;
            } else {
                throw e;
            }
        } finally {
            this.loginOutput.hideBusyIndicator();
        }
    }

    async signInWithGoogle(): Promise<void> {
        this.loginOutput.showBusyIndicator();
        this.sessionService.pauseLoadOnce();
        try {
            const userData = await this.authentication.authenticateWithGoogle();
            await this.loadOrCreateAccount(userData);
            await this.sessionService.start();
        } catch (e) {
            if (
                e instanceof GooglePlayServicesNotAvailable ||
                e instanceof GoogleSignInFailed ||
                e instanceof EmailNotFound ||
                e instanceof IncorrectSignInMethod
            ) {
                this.loginOutput.showFederatedLoginError(e);
            } else if (e instanceof SignInCanceled) {
                return;
            } else {
                throw e;
            }
        } finally {
            this.loginOutput.hideBusyIndicator();
        }
    }

    private async loadOrCreateAccount(userData: UserData): Promise<void> {
        try {
            await this.loadAccountFromRemote(userData.uid);
        } catch (e) {
            if (e instanceof AccountDoesNotExistOnRemote) {
                await this.accountRegistrationService.registerFederated(
                    userData.uid,
                    userData.emailAddress
                );
            } else {
                throw e;
            }
        }
    }

    private async loadAccountFromRemote(uid: string): Promise<void> {
        const account = await this.accountRepoRemote.getByUID(uid);
        await this.accountRepoLocal.add(account);
        const muTags = await this.muTagRepoRemote.getAll(uid);
        await this.muTagRepoLocal.addMultiple(muTags);
    }

    private isLoginServiceException(
        value: any
    ): value is LoginServiceException {
        return (
            value instanceof ImproperEmailFormat ||
            value instanceof ImproperPasswordComplexity
        );
    }

    private isAuthenticationException(
        value: any
    ): value is AuthenticationException {
        return (
            value instanceof InvalidCredentials ||
            value instanceof UserDisabled ||
            value instanceof IncorrectSignInMethod ||
            value instanceof TooManyAttempts ||
            value instanceof SignInCanceled ||
            value instanceof GooglePlayServicesNotAvailable ||
            value instanceof GoogleSignInFailed ||
            value instanceof FacebookSignInFailed ||
            value instanceof EmailNotFound
        );
    }

    private isAccountRepositoryLocalException(
        value: any
    ): value is AccountRepositoryLocalException {
        return (
            value instanceof AccountDoesNotExistOnLocal ||
            value instanceof FailedToGet ||
            value instanceof FailedToAdd ||
            value instanceof FailedToRemove
        );
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

        const symbols = "!-/:-@\\[-`{-~";

        /*  This should allow any Unicode letter. RegExp currently doesn't
            support '\p{L}'.
        */
        const anyLetter = `[^${symbols}\\d]`;

        const letterOrNumber = `(${anyLetter}|\\d)`;
        const letterOrSymbol = `(${anyLetter}|[${symbols}])`;
        const numberOrSymbol = `(\\d|[${symbols}])`;

        const regexTwo = `^(?=.*${letterOrNumber})(?=.*${letterOrSymbol})(?=.*${numberOrSymbol}).{8,}$`;
        const regexpTwo = new RegExp(regexTwo);
        const testTwo = regexpTwo.test(this.password);

        return testOne && testTwo;
    }

    rawValue(): string {
        return this.password;
    }
}
