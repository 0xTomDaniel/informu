import { UserData } from "./UserData";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

export interface Authentication {
    authenticateWithEmail(
        emailAddress: string,
        password: string
    ): Promise<UserData>;
    authenticateWithFacebook(): Promise<UserData>;
    authenticateWithGoogle(): Promise<UserData>;
    isAuthenticatedAs(uid: string): boolean;
}

export class InvalidCredentials extends UserError {
    name = "InvalidCredentials";
    userErrorDescription = "Wrong email address or password. Please try again.";
}

export class UserDisabled extends UserError {
    name = "UserDisabled";
    userErrorDescription =
        "This user is currently disabled. Please contact support@informu.io.";
}

export class IncorrectSignInMethod extends UserError {
    name = "IncorrectSignInMethod";
    userErrorDescription =
        "An account already exists with the same email address but different sign-in credentials. Sign in using a provider already associated with this email address.";
}

export class TooManyAttempts extends UserError {
    name = "TooManyAttempts";
    userErrorDescription =
        "Too many unsuccessful login attempts. Please try again later.";
}

export class SignInCanceled extends UserError {
    name = "SignInCanceled";
    userErrorDescription = "The sign in has been canceled.";
}

export class GooglePlayServicesNotAvailable extends UserError {
    name = "GooglePlayServicesNotAvailable";
    userErrorDescription =
        "Google Play services must be installed to log in with Google.";
}

export class GoogleSignInFailed extends UserError {
    name = "GoogleSignInFailed";
    userErrorDescription =
        "Failed to sign in with Google. Please contact support@informu.io.";
}

export class FacebookSignInFailed extends UserError {
    name = "FacebookSignInFailed";
    userErrorDescription =
        "Failed to sign in with Facebook. Please contact support@informu.io.";
}

export class EmailNotFound extends UserError {
    name = "EmailNotFound";
    userErrorDescription = "Failed to sign in. Email address not found.";
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
