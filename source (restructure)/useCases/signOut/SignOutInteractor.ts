import SessionService from "../../../source/Core/Application/SessionService";
import Exception from "../../shared/metaLanguage/Exception";

const ExceptionType = ["SignOutFailed"] as const;
export type ExceptionType = typeof ExceptionType[number];

export class SignOutInteractorException<
    T extends ExceptionType
> extends Exception<T> {
    static SignOutFailed(
        sourceException: unknown
    ): SignOutInteractorException<"SignOutFailed"> {
        return new this(
            "SignOutFailed",
            "Failed to sign out.",
            "error",
            sourceException,
            true
        );
    }
}

export default interface SignOutInteractor {
    signOut: () => Promise<void>;
}

export class SignOutInteractorImpl implements SignOutInteractor {
    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    async signOut(): Promise<void> {
        await this.sessionService.end().catch(e => {
            throw SignOutInteractorException.SignOutFailed(e);
        });
    }

    private readonly sessionService: SessionService;
}
