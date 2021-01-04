import {
    Authentication,
    AuthenticationException
} from "../../Core/Ports/Authentication";
import auth, { firebase } from "@react-native-firebase/auth";
import { UserData } from "../../Core/Ports/UserData";
import {
    GoogleSignin,
    statusCodes
} from "@react-native-community/google-signin";
import { LoginManager, AccessToken } from "react-native-fbsdk";

export class AuthenticationFirebase implements Authentication {
    constructor(webClientID: string) {
        GoogleSignin.configure({ webClientId: webClientID });
    }

    async authenticateWithEmail(
        emailAddress: string,
        password: string
    ): Promise<UserData> {
        try {
            const userCredential = await auth().signInWithEmailAndPassword(
                emailAddress,
                password
            );
            const userData = {
                uid: userCredential.user.uid,
                emailAddress: emailAddress,
                name: userCredential.user.displayName ?? ""
            };
            return userData;
        } catch (e) {
            throw this.convertError(e);
        }
    }

    async authenticateWithFacebook(): Promise<UserData> {
        try {
            LoginManager.logOut();
            const result = await LoginManager.logInWithPermissions([
                "public_profile",
                "email"
            ]);
            if (result.isCancelled) {
                throw AuthenticationException.SignInCanceled;
            }
            const accessToken = await AccessToken.getCurrentAccessToken();
            if (accessToken == null) {
                throw AuthenticationException.FacebookSignInFailed;
            }
            const authCredential = firebase.auth.FacebookAuthProvider.credential(
                accessToken.accessToken
            );
            const userCredential = await auth().signInWithCredential(
                authCredential
            );
            if (userCredential.user.email == null) {
                throw AuthenticationException.EmailNotFound;
            }
            return {
                uid: userCredential.user.uid,
                emailAddress: userCredential.user.email,
                name: userCredential.user.displayName ?? ""
            };
        } catch (e) {
            throw this.convertError(e);
        }
    }

    async authenticateWithGoogle(): Promise<UserData> {
        try {
            await GoogleSignin.hasPlayServices();

            // Must sign out so that user can choose a Google account to sign in
            // with. Otherwise it will automatically use the previously chosen account.
            //
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (isSignedIn) {
                await GoogleSignin.signOut();
            }

            const user = await GoogleSignin.signIn();
            if (user.idToken == null) {
                throw AuthenticationException.GoogleSignInFailed;
            }
            const authCredential = firebase.auth.GoogleAuthProvider.credential(
                user.idToken
            );
            const userCredential = await auth().signInWithCredential(
                authCredential
            );
            if (userCredential.user.email == null) {
                throw AuthenticationException.EmailNotFound;
            }
            return {
                uid: userCredential.user.uid,
                emailAddress: userCredential.user.email,
                name: userCredential.user.displayName ?? ""
            };
        } catch (e) {
            throw this.convertError(e);
        }
    }

    isAuthenticatedAs(uid: string): boolean {
        const currentUser = auth().currentUser;
        return currentUser != null && currentUser.uid === uid;
    }

    private convertError(error: any): any {
        const errorCode = error.code;
        switch (errorCode) {
            case "auth/invalid-email":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return AuthenticationException.InvalidCredentials;
            case "auth/user-disabled":
                return AuthenticationException.UserDisabled;
            case "auth/account-exists-with-different-credential":
                return AuthenticationException.IncorrectSignInProvider;
            case "auth/unknown":
                switch (error.message) {
                    case "We have blocked all requests from this device due to unusual activity. Try again later. [ Too many unsuccessful login attempts.  Please include reCaptcha verification or try again later ]":
                        return AuthenticationException.TooManyAttempts;
                    default:
                        return error;
                }
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                return AuthenticationException.GooglePlayServicesNotAvailable;
            case statusCodes.SIGN_IN_CANCELLED:
                return AuthenticationException.SignInCanceled;
            default:
                return error;
        }
    }
}
