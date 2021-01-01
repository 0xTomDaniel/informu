import LoginOutput from "../Ports/LoginOutput";
import {
    Authentication,
    AuthenticationException
} from "../Ports/Authentication";
import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import {
    AccountRepositoryLocal,
    AccountRepositoryLocalException
} from "../Ports/AccountRepositoryLocal";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import { Session } from "./SessionService";
import { AccountRegistration } from "./AccountRegistrationService";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

const ExceptionType = [
    "InvalidEmailFormat",
    "InvalidPasswordComplexity",
    "UnknownError"
] as const;
type ExceptionType = typeof ExceptionType[number];

export class LoginServiceException<T extends ExceptionType> extends Exception<
    T
> {
    static get InvalidEmailFormat(): LoginServiceException<
        "InvalidEmailFormat"
    > {
        return new this("InvalidEmailFormat", "Invalid email address.", "warn");
    }

    static get InvalidPasswordComplexity(): LoginServiceException<
        "InvalidPasswordComplexity"
    > {
        return new this(
            "InvalidPasswordComplexity",
            "Password does not meet complexity requirements.",
            "warn"
        );
    }

    static UnknownError(
        originatingException: unknown
    ): LoginServiceException<"UnknownError"> {
        return new this(
            "UnknownError",
            "Unknown error sign in error.",
            "error",
            originatingException,
            true
        );
    }
}

/*export const ImproperEmailFormat: UserErrorType = {
    name: "ImproperEmailFormat",
    userFriendlyMessage: "This is not a proper email address."
};

export const ImproperPasswordComplexity: UserErrorType = {
    name: "ImproperPasswordComplexity",
    userFriendlyMessage: "Password doesn't meet complexity requirements."
};

const GenericSignInError: UserErrorType = {
    name: "GenericSignInError",
    userFriendlyMessage: "Failed to sign in."
};*/

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
                throw LoginServiceException.InvalidEmailFormat;
            }
            if (!password.isValid()) {
                throw LoginServiceException.InvalidPasswordComplexity;
            }
            this.loginOutput.showBusyIndicator();
            const userData = await this.authentication.authenticateWithEmail(
                emailAddress.rawValue(),
                password.rawValue()
            );
            await this.sessionService.start(userData);
        } catch (e) {
            if (
                LoginServiceException.isType(e) ||
                AuthenticationException.isType(e) ||
                AccountRepositoryLocalException.isType(e)
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
            await this.sessionService.start(userData);
        } catch (e) {
            switch (e.name) {
                case "FacebookSignInFailed":
                case "EmailNotFound":
                case "IncorrectSignInMethod":
                    this.loginOutput.showFederatedLoginError(e);
                    break;
                case "SignInCanceled":
                    return;
                default:
                    this.loginOutput.showFederatedLoginError(
                        LoginServiceException.UnknownError(e)
                    );
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
            await this.sessionService.start(userData);
        } catch (e) {
            switch (e.name) {
                case "GooglePlayServicesNotAvailable":
                case "GoogleSignInFailed":
                case "EmailNotFound":
                case "IncorrectSignInMethod":
                    this.loginOutput.showFederatedLoginError(e);
                    break;
                case "SignInCanceled":
                    return;
                default:
                    this.loginOutput.showFederatedLoginError(
                        LoginServiceException.UnknownError(e)
                    );
            }
        } finally {
            this.loginOutput.hideBusyIndicator();
        }
    }

    continueSignIn(): void {
        this.sessionService.continueStart();
    }

    abortSignIn(): void {
        this.sessionService.abortStart();
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
