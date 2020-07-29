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
    readonly originatingError?: any;
    readonly userFriendlyMessage: string;

    private constructor(
        name: string,
        userFriendlyMessage: string,
        originatingError?: any
    ) {
        super(userFriendlyMessage);
        this.name = name;
        this.userFriendlyMessage = userFriendlyMessage;
        this.originatingError = originatingError;
    }

    toViewData(): UserErrorViewData {
        return {
            errorDescription: this.userFriendlyMessage,
            detailedErrorDescription: JSON.stringify(
                this.originatingError,
                Object.getOwnPropertyNames(this.originatingError)
            )
        };
    }

    static create(
        type: UserErrorType,
        originatingError?: any,
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
