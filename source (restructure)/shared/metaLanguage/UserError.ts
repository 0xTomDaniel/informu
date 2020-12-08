import Logger from "./Logger";

export interface UserErrorViewData {
    errorDescription: string;
    detailedErrorDescription?: string;
}

export interface UserErrorType {
    name: string;
    userFriendlyMessage: string;
}

export default class UserError extends Error {
    private static get logger(): Logger {
        return Logger.instance;
    }
    readonly name: string;
    readonly originatingError: unknown;
    readonly userFriendlyMessage: string;

    private constructor(
        name: string,
        userFriendlyMessage: string,
        originatingError: unknown
    ) {
        // Concatenating to *message* so that Jest knows the inequality when
        // *originatingError* is different between *UserError* objects.
        const message =
            originatingError == null
                ? userFriendlyMessage
                : `${userFriendlyMessage} <- ${String(originatingError)}`;
        super(message);
        //this.name = this.constructor.name;
        this.name = name;
        this.userFriendlyMessage = userFriendlyMessage;
        this.originatingError = originatingError;
    }

    toViewData(): UserErrorViewData {
        const viewData: UserErrorViewData = {
            errorDescription: this.userFriendlyMessage
        };
        if (this.originatingError != null) {
            viewData.detailedErrorDescription = JSON.stringify(
                this.originatingError,
                Object.getOwnPropertyNames(this.originatingError)
            );
        }
        return viewData;
    }

    static create(
        type: UserErrorType,
        originatingError?: unknown,
        logEvent = true
    ): UserError {
        const userError = new this(
            type.name,
            type.userFriendlyMessage,
            originatingError
        );
        if (logEvent) {
            if (this.logger == null) {
                throw Error("Logger instance is undefined.");
            }
            this.logger.error(userError, true);
        }
        return userError;
    }
}
