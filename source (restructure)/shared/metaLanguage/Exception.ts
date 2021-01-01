import Logger from "./Logger";

type Severity = "log" | "warn" | "error";

export default abstract class Exception<T extends string> extends Error {
    readonly name: string;
    readonly originatingException: unknown;
    readonly severity: Severity;
    readonly type: T;

    constructor(
        type: T,
        message: string,
        severity: Severity,
        originatingException?: unknown,
        reportEvent = false,
        logEvent = true
    ) {
        // Concatenating to *message* so that Jest knows the inequality when
        // *originatingError* is different between *Exception* objects.
        super(
            originatingException == null
                ? message
                : `${message}\n<- ${String(originatingException)}`
        );
        this.type = type;
        this.name = this.constructor.name;
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

    static isType<T extends string, E extends Exception<string>>(
        this: new (type: T, ...args: any) => E,
        value: unknown,
        type?: T
    ): value is E & Exception<T> {
        if (value instanceof this) {
            return type == null ? true : value.type === type;
        }
        return false;
    }

    private static get logger(): Logger {
        return Logger.instance;
    }
}
