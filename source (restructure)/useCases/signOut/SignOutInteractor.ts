import SessionService from "../../../source/Core/Application/SessionService";
import Exception from "../../shared/metaLanguage/Exception";

type ExceptionType = {
    type: "SignOutFailed";
    data: [];
};

export class SignOutInteractorException extends Exception<ExceptionType> {
    static SignOutFailed(sourceException: unknown): SignOutInteractorException {
        return new this(
            { type: "SignOutFailed", data: [] },
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
