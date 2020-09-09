import { Session } from "../../../source/Core/Application/SessionService";
import { Subject, Observable } from "rxjs";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";

interface SignOutFailed extends UserErrorType {
    name: "signOutFailed";
}

export type SignOutError = SignOutFailed;

export default interface SignOutInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<UserError<SignOutError>>;
    readonly showSignIn: Observable<void>;
    signOut: () => Promise<void>;
}

export class SignOutInteractorImpl implements SignOutInteractor {
    private static createError(
        type: SignOutError,
        originatingError: unknown
    ): UserError<SignOutError> {
        return UserError.create(type, originatingError);
    }

    private readonly sessionService: Session;
    private readonly showActivityIndicatorSubject = new Subject<boolean>();
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    private readonly showErrorSubject = new Subject<UserError<SignOutError>>();
    readonly showError = this.showErrorSubject.asObservable();
    private readonly showSignInSubject = new Subject<void>();
    readonly showSignIn = this.showSignInSubject.asObservable();

    constructor(sessionService: Session) {
        this.sessionService = sessionService;
    }

    async signOut(): Promise<void> {
        this.showActivityIndicatorSubject.next(true);
        await this.sessionService.end().catch(e => {
            this.showErrorSubject.next(
                SignOutInteractorImpl.createError(
                    {
                        name: "signOutFailed"
                    },
                    e
                )
            );
        });
        this.showActivityIndicatorSubject.next(false);
        this.showSignInSubject.next();
    }
}
