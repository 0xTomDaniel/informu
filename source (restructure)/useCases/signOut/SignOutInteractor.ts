import { Session } from "../../../source/Core/Application/SessionService";
import { Subject, Observable } from "rxjs";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import Localize from "../../shared/localization/Localize";

const localize = Localize.instance;

const SignOutFailed: UserErrorType = {
    name: "SignOutFailed",
    userFriendlyMessage: localize.getText("signOut", "error", "signOutFailed")
};

export default interface SignOutInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<UserError>;
    readonly showSignIn: Observable<void>;
    signOut: () => Promise<void>;
}

export class SignOutInteractorImpl implements SignOutInteractor {
    private readonly sessionService: Session;
    private readonly showActivityIndicatorSubject = new Subject<boolean>();
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    private readonly showErrorSubject = new Subject<UserError>();
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
                UserError.create(SignOutFailed, e, true)
            );
        });
        this.showActivityIndicatorSubject.next(false);
        this.showSignInSubject.next();
    }
}
