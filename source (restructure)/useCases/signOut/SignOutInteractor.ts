import SessionService from "../../../source/Core/Application/SessionService";
import { Subject, Observable } from "rxjs";
import Exception from "../../shared/metaLanguage/Exception";

const ExceptionType = ["SignOutFailed"] as const;
export type ExceptionType = typeof ExceptionType[number];

export class SignOutInteractorException<
    T extends ExceptionType
> extends Exception<T> {
    static SignOutFailed(
        originatingException: unknown
    ): SignOutInteractorException<"SignOutFailed"> {
        return new this(
            "SignOutFailed",
            "Failed to sign out.",
            "error",
            originatingException,
            true
        );
    }
}

export default interface SignOutInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<SignOutInteractorException<ExceptionType>>;
    readonly showSignIn: Observable<void>;
    signOut: () => Promise<void>;
}

export class SignOutInteractorImpl implements SignOutInteractor {
    private readonly sessionService: SessionService;
    private readonly showActivityIndicatorSubject = new Subject<boolean>();
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    private readonly showErrorSubject = new Subject<
        SignOutInteractorException<ExceptionType>
    >();
    readonly showError = this.showErrorSubject.asObservable();
    private readonly showSignInSubject = new Subject<void>();
    readonly showSignIn = this.showSignInSubject.asObservable();

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    async signOut(): Promise<void> {
        this.showActivityIndicatorSubject.next(true);
        await this.sessionService.end().catch(e => {
            this.showErrorSubject.next(
                SignOutInteractorException.SignOutFailed(e)
            );
        });
        this.showActivityIndicatorSubject.next(false);
        this.showSignInSubject.next();
    }
}
