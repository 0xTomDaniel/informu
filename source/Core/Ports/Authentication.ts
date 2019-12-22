import { UserData } from "./UserData";

export interface Authentication {
    authenticateWithEmail(
        emailAddress: string,
        password: string
    ): Promise<UserData>;
    authenticateWithFacebook(): Promise<UserData>;
    authenticateWithGoogle(): Promise<UserData>;
    isAuthenticatedAs(uid: string): boolean;
}

export class InvalidCredentials extends Error {
    constructor() {
        super("Wrong email address or password. Please try again.");
        this.name = "InvalidCredentials";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class UserDisabled extends Error {
    constructor() {
        super(
            "This user is currently disabled. Please contact support@informu.io."
        );
        this.name = "UserDisabled";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class IncorrectSignInMethod extends Error {
    constructor() {
        super(
            "An account already exists with the same email address but different sign-in credentials. Sign in using a provider already associated with this email address."
        );
        this.name = "IncorrectSignInMethod";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class TooManyAttempts extends Error {
    constructor() {
        super("Too many unsuccessful login attempts. Please try again later.");
        this.name = "TooManyAttempts";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class SignInCanceled extends Error {
    constructor() {
        super("The sign in has been canceled.");
        this.name = "SignInCanceled";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class GooglePlayServicesNotAvailable extends Error {
    constructor() {
        super("Google Play services must be installed to log in with Google.");
        this.name = "GooglePlayServicesNotAvailable";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class GoogleSignInFailed extends Error {
    constructor() {
        super(
            "Failed to sign in with Google. Please contact support@informu.io."
        );
        this.name = "GoogleSignInFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FacebookSignInFailed extends Error {
    constructor() {
        super(
            "Failed to sign in with Facebook. Please contact support@informu.io."
        );
        this.name = "FacebookSignInFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class EmailNotFound extends Error {
    constructor() {
        super("Failed to sign in. Email address not found.");
        this.name = "EmailNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/*export enum FederatedAuthType {
    Google,
    Facebook
}

export class FederatedAccountDoesNotExist extends Error {
    constructor(type: FederatedAuthType) {
        super(
            `Account does not exist for ${FederatedAuthType[type]} credentials.`
        );
        this.name = "FederatedAccountDoesNotExist";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}*/

export type AuthenticationException =
    | InvalidCredentials
    | UserDisabled
    | IncorrectSignInMethod
    | TooManyAttempts
    | SignInCanceled
    | GooglePlayServicesNotAvailable
    | GoogleSignInFailed
    | FacebookSignInFailed
    | EmailNotFound;
