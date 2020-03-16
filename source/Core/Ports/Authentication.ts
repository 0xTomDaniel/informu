import { UserData } from "./UserData";
import { UserErrorType } from "../../../source (restructure)/shared/metaLanguage/UserError";

export interface Authentication {
    authenticateWithEmail(
        emailAddress: string,
        password: string
    ): Promise<UserData>;
    authenticateWithFacebook(): Promise<UserData>;
    authenticateWithGoogle(): Promise<UserData>;
    isAuthenticatedAs(uid: string): boolean;
}

export const InvalidCredentials: UserErrorType = {
    name: "InvalidCredentials",
    userFriendlyMessage: "Wrong email address or password. Please try again."
};

export const UserDisabled: UserErrorType = {
    name: "UserDisabled",
    userFriendlyMessage:
        "This user is currently disabled. Please contact support@informu.io."
};

export const IncorrectSignInMethod: UserErrorType = {
    name: "IncorrectSignInMethod",
    userFriendlyMessage:
        "An account already exists with the same email address but different sign-in credentials. Sign in using a provider already associated with this email address."
};

export const TooManyAttempts: UserErrorType = {
    name: "TooManyAttempts",
    userFriendlyMessage:
        "Too many unsuccessful login attempts. Please try again later."
};

export const SignInCanceled: UserErrorType = {
    name: "SignInCanceled",
    userFriendlyMessage: "The sign in has been canceled."
};

export const GooglePlayServicesNotAvailable: UserErrorType = {
    name: "GooglePlayServicesNotAvailable",
    userFriendlyMessage:
        "Google Play services must be installed to log in with Google."
};

export const GoogleSignInFailed: UserErrorType = {
    name: "GoogleSignInFailed",
    userFriendlyMessage:
        "Failed to sign in with Google. Please contact support@informu.io."
};

export const FacebookSignInFailed: UserErrorType = {
    name: "FacebookSignInFailed",
    userFriendlyMessage:
        "Failed to sign in with Facebook. Please contact support@informu.io."
};

export const EmailNotFound: UserErrorType = {
    name: "EmailNotFound",
    userFriendlyMessage: "Failed to sign in. Email address not found."
};

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
