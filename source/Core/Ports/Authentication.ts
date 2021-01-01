import { UserData } from "./UserData";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export interface Authentication {
    authenticateWithEmail(
        emailAddress: string,
        password: string
    ): Promise<UserData>;
    authenticateWithFacebook(): Promise<UserData>;
    authenticateWithGoogle(): Promise<UserData>;
    isAuthenticatedAs(uid: string): boolean;
}

const ExceptionType = [
    "EmailNotFound",
    "FacebookSignInFailed",
    "GooglePlayServicesNotAvailable",
    "GoogleSignInFailed",
    "IncorrectSignInProvider",
    "InvalidCredentials",
    "SignInCanceled",
    "TooManyAttempts",
    "UserDisabled"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class AuthenticationException<T extends ExceptionType> extends Exception<
    T
> {
    static EmailNotFound(
        emailAddress: string,
        originatingError: unknown
    ): AuthenticationException<"EmailNotFound"> {
        return new this(
            "EmailNotFound",
            `No account exists for the email address ${emailAddress}.`,
            "log",
            originatingError
        );
    }

    static FacebookSignInFailed(
        originatingError: unknown
    ): AuthenticationException<"FacebookSignInFailed"> {
        return new this(
            "FacebookSignInFailed",
            "Failed to sign in with Facebook.",
            "error",
            originatingError,
            true
        );
    }

    static GooglePlayServicesNotAvailable(
        originatingError: unknown
    ): AuthenticationException<"GooglePlayServicesNotAvailable"> {
        return new this(
            "GooglePlayServicesNotAvailable",
            "Google Play services must be installed to sign in with Google.",
            "warn",
            originatingError
        );
    }

    static GoogleSignInFailed(
        originatingError: unknown
    ): AuthenticationException<"GoogleSignInFailed"> {
        return new this(
            "GoogleSignInFailed",
            "Failed to sign in with Google.",
            "error",
            originatingError,
            true
        );
    }

    static IncorrectSignInProvider(
        emailAddress: string,
        incorrectProvider: string,
        originatingError: unknown
    ): AuthenticationException<"IncorrectSignInProvider"> {
        return new this(
            "IncorrectSignInProvider",
            `The account for ${emailAddress} is not registered with the ${incorrectProvider} sign in provider.`,
            "warn",
            originatingError,
            true
        );
    }

    static InvalidCredentials(
        originatingError: unknown
    ): AuthenticationException<"InvalidCredentials"> {
        return new this(
            "InvalidCredentials",
            "Wrong email address or password.",
            "warn",
            originatingError
        );
    }

    static SignInCanceled(
        originatingError: unknown
    ): AuthenticationException<"SignInCanceled"> {
        return new this(
            "SignInCanceled",
            "Sign in has been canceled.",
            "log",
            originatingError
        );
    }

    static TooManyAttempts(
        originatingError: unknown
    ): AuthenticationException<"TooManyAttempts"> {
        return new this(
            "TooManyAttempts",
            "Too many unsuccessful sign in attempts.",
            "warn",
            originatingError,
            true
        );
    }

    static UserDisabled(
        originatingError: unknown
    ): AuthenticationException<"UserDisabled"> {
        return new this(
            "UserDisabled",
            "This user is currently disabled.",
            "warn",
            originatingError,
            true
        );
    }
}
