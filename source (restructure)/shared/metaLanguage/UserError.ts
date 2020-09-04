import Logger from "./Logger";

/*export interface UserErrorViewData {
    errorDescription: string;
    detailedErrorDescription?: string;
}*/

export interface UserErrorType {
    name: string;
}

export default class UserError<T extends UserErrorType> {
    private static get logger(): Logger {
        return Logger.instance;
    }

    static create<T extends Readonly<UserErrorType>>(
        type: T,
        originatingError?: unknown,
        logEvent = true
    ): UserError<T> {
        const userError = new this(type, originatingError);
        if (logEvent) {
            if (this.logger == null) {
                throw Error("Logger instance is undefined.");
            }
            this.logger.error(userError, true);
        }
        return userError;
    }

    get details(): string {
        return JSON.stringify(
            this.originatingError,
            Object.getOwnPropertyNames(this.originatingError),
            2
        );
    }

    readonly originatingError?: unknown;
    readonly type: T;

    private constructor(type: T, originatingError?: unknown) {
        this.originatingError = originatingError;
        this.type = type;
    }
}
