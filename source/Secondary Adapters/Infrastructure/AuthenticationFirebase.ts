import {
    Authentication,
    InvalidCredentials,
    UserDisabled,
    TooManyAttempts,
    GoogleSignInFailed,
    GooglePlayServicesNotAvailable,
    EmailNotFound
} from "../../Core/Ports/Authentication";
import auth, { firebase } from "@react-native-firebase/auth";
import { UserData } from "../../Core/Ports/UserData";
import {
    GoogleSignin,
    statusCodes
} from "@react-native-community/google-signin";

export class AuthenticationFirebase implements Authentication {
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
                emailAddress: emailAddress
            };
            return userData;
        } catch (e) {
            const errorCode = e.code;
            switch (errorCode) {
                case "auth/invalid-email":
                case "auth/user-not-found":
                case "auth/wrong-password":
                    throw new InvalidCredentials();
                case "auth/user-disabled":
                    throw new UserDisabled();
                case "auth/unknown":
                    switch (e.message) {
                        case "We have blocked all requests from this device due to unusual activity. Try again later. [ Too many unsuccessful login attempts.  Please include reCaptcha verification or try again later ]":
                            throw new TooManyAttempts();
                        default:
                            throw e;
                    }
                default:
                    throw e;
            }
        }
    }

    async authenticateWithGoogle(): Promise<UserData> {
        try {
            await GoogleSignin.hasPlayServices();
            const user = await GoogleSignin.signIn();
            if (user.idToken == null) {
                throw new GoogleSignInFailed();
            }
            const authCredential = firebase.auth.GoogleAuthProvider.credential(
                user.idToken
            );
            const userCredential = await auth().signInWithCredential(
                authCredential
            );
            if (userCredential.user.email == null) {
                throw new EmailNotFound();
            }
            return {
                uid: userCredential.user.uid,
                emailAddress: userCredential.user.email
            };
        } catch (e) {
            console.warn(e);
            switch (e.code) {
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    throw new GooglePlayServicesNotAvailable();
                default:
                    throw e;
            }
        }
    }

    isAuthenticatedAs(uid: string): boolean {
        const currentUser = auth().currentUser;
        return currentUser != null && currentUser.uid === uid;
    }
}
