import Logger from "./Logger";

type Severity = "log" | "warn" | "error";

export default abstract class Exception<T extends string> extends Error {
    get message(): string {
        return this._message;
    }
    readonly name: string;
    readonly originatingException: unknown;
    readonly severity: Severity;
    readonly type: T;

    protected constructor(
        type: T,
        message: string,
        severity: Severity,
        originatingException?: unknown,
        logEvent = false,
        reportEvent = false
    ) {
        super();
        this.type = type;
        this.name = this.constructor.name;
        // Concatenating to *message* so that Jest knows the inequality when
        // *originatingError* is different between *Exception* objects.
        this._message =
            originatingException == null
                ? message
                : `${message}\n<- ${String(originatingException)}`;
        this.originatingException = originatingException;
        this.severity = severity;
        if (logEvent || reportEvent) {
            if (Exception.logger == null) {
                throw Error("Logger instance is undefined.");
            }
            switch (severity) {
                case "log":
                    Exception.logger.log(this, reportEvent, logEvent);
                    break;
                case "warn":
                    Exception.logger.warn(this, reportEvent, logEvent);
                    break;
                case "error":
                    Exception.logger.error(this, reportEvent, logEvent);
                    break;
            }
        }
    }

    private _message: string;

    private static get logger(): Logger {
        return Logger.instance;
    }
}
