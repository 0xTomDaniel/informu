import { Authentication, UserData, InvalidCredentials, AccountDisabled, TooManyAttempts } from '../../Core/Ports/Authentication';
import auth from '@react-native-firebase/auth';

export class AuthenticationFirebase implements Authentication {

    async authenticateWithEmail(emailAddress: string, password: string): Promise<UserData> {
        try {
            const userCredential = await auth()
                .signInWithEmailAndPassword(emailAddress, password);
            const userData = {
                uid: userCredential.user.uid,
                emailAddress: emailAddress,
            };

            return userData;
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

    isAuthenticatedAs(uid: string): boolean {
        const currentUser = auth().currentUser;

        return currentUser != null && currentUser.uid === uid;
    }
}
