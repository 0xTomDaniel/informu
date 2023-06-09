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

const SignInProvider = ["Email", "Facebook", "Google"] as const;
export type SignInProvider = typeof SignInProvider[number];

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
        sourceException: unknown
    ): AuthenticationException<"EmailNotFound"> {
        return new this(
            "EmailNotFound",
            `No account exists for the email address ${emailAddress}.`,
            "log",
            sourceException
        );
    }

    static FacebookSignInFailed(
        sourceException: unknown
    ): AuthenticationException<"FacebookSignInFailed"> {
        return new this(
            "FacebookSignInFailed",
            "Failed to sign in with Facebook.",
            "error",
            sourceException,
            true
        );
    }

    static GooglePlayServicesNotAvailable(
        sourceException: unknown
    ): AuthenticationException<"GooglePlayServicesNotAvailable"> {
        return new this(
            "GooglePlayServicesNotAvailable",
            "Google Play services must be installed to sign in with Google.",
            "warn",
            sourceException
        );
    }

    static GoogleSignInFailed(
        sourceException: unknown
    ): AuthenticationException<"GoogleSignInFailed"> {
        return new this(
            "GoogleSignInFailed",
            "Failed to sign in with Google.",
            "error",
            sourceException,
            true
        );
    }

    static IncorrectSignInProvider(
        incorrectProvider: SignInProvider,
        sourceException: unknown
    ): AuthenticationException<"IncorrectSignInProvider"> {
        return new this(
            "IncorrectSignInProvider",
            `The user with the supplied email address is not registered with the ${incorrectProvider} sign in provider.`,
            "warn",
            sourceException,
            true
        );
    }

    static InvalidCredentials(
        sourceException: unknown
    ): AuthenticationException<"InvalidCredentials"> {
        return new this(
            "InvalidCredentials",
            "Wrong email address or password.",
            "warn",
            sourceException
        );
    }

    static SignInCanceled(
        sourceException: unknown
    ): AuthenticationException<"SignInCanceled"> {
        return new this(
            "SignInCanceled",
            "Sign in has been canceled.",
            "log",
            sourceException
        );
    }

    static TooManyAttempts(
        sourceException: unknown
    ): AuthenticationException<"TooManyAttempts"> {
        return new this(
            "TooManyAttempts",
            "Too many unsuccessful sign in attempts.",
            "warn",
            sourceException,
            true
        );
    }

    static UserDisabled(
        sourceException: unknown
    ): AuthenticationException<"UserDisabled"> {
        return new this(
            "UserDisabled",
            "This user is currently disabled.",
            "warn",
            sourceException,
            true
        );
    }
}
