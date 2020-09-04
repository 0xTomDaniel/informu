import Logger from "./Logger";

export interface UserWarningType {
    name: string;
}

export default class UserWarning<T extends UserWarningType> {
    private static get logger(): Logger {
        return Logger.instance;
    }

    static create<T extends Readonly<UserWarningType>>(
        type: T,
        originatingError?: unknown,
        logEvent = true
    ): UserWarning<T> {
        const userWarning = new this(type, originatingError);
        if (logEvent) {
            if (this.logger == null) {
                throw Error("Logger instance is undefined.");
            }
            this.logger.warn(userWarning, true);
        }
        return userWarning;
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
