import { Authentication, UserData, InvalidCredentials, AccountDisabled, TooManyAttempts } from '../../Core/Ports/Authentication';
import { Auth } from 'react-native-firebase/auth';
import firebase, { App } from 'react-native-firebase';

export class AuthenticationFirebase implements Authentication {

    private readonly auth: Auth;

    constructor(app?: App) {
        if (app != null) {
            this.auth = app.auth();
        } else {
            this.auth = firebase.auth();
        }
    }

    async authenticateWithEmail(emailAddress: string, password: string): Promise<UserData> {
        try {
            const userCredential = await this.auth
                .signInWithEmailAndPassword(emailAddress, password);
            const userData = {
                uid: userCredential.user.uid,
                emailAddress: emailAddress,
            };

            return Promise.resolve(userData);
        } catch (e) {
            const errorCode = e.code;
            switch (errorCode) {
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    throw new InvalidCredentials();
                case 'auth/user-disabled':
                    throw new AccountDisabled();
                case 'auth/unknown':
                    switch (e.message) {
                        case 'We have blocked all requests from this device due to unusual activity. Try again later. [ Too many unsuccessful login attempts.  Please include reCaptcha verification or try again later ]':
                            throw new TooManyAttempts();
                        default:
                            throw e;
                    }
                default:
                    throw e;
            }
        }
    }

    async isAuthenticatedAs(uid: string): Promise<boolean> {
        const currentUser = this.auth.currentUser;

        return currentUser != null && currentUser.uid === uid;
    }
}
