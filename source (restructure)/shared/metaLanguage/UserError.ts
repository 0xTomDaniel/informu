import Logger from "./Logger";

export interface UserErrorType {
    name: string;
}

export default class UserError<T extends UserErrorType> {
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

    /*private constructor(type: T, originatingError?: unknown) {
        this.originatingError = originatingError;
        this.type = type;
    }*/
}
