import Logger from "./Logger";

export interface UserWarningType {
    name: string;
    userFriendlyMessage: string;
}

export default class UserWarning extends Error {
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

    static create(
        type: UserWarningType,
        originatingError?: any,
        logEvent = true
    ): UserWarning {
        const userWarning = new this(
            type.name,
            type.userFriendlyMessage,
            originatingError
        );
        if (logEvent) {
            if (this.logger == null) {
                throw Error("Logger instance is undefined.");
            }
            this.logger.warn(userWarning, true);
        }
        return userWarning;
    }
}
