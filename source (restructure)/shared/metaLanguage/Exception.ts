import Logger from "./Logger";

type Severity = "log" | "warn" | "error";

export type ExceptionAttributes = {
    type: string;
    data: readonly [...any];
};

export default abstract class Exception<
    A extends ExceptionAttributes
> extends Error {
    readonly attributes: A;
    readonly name: string;
    readonly sourceException: unknown;
    readonly severity: Severity;

    constructor(
        attributes: A,
        message: string,
        severity: Severity,
        sourceException?: unknown,
        reportEvent = false,
        logEvent = true
    ) {
        // Concatenating to *message* so that Jest knows the inequality when
        // *sourceException* is different between *Exception* objects.
        super(
            sourceException == null
                ? message
                : `${message}\n<- ${String(sourceException)}`
        );
        this.attributes = attributes;
        this.name = this.constructor.name;
        this.sourceException = sourceException;
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

    static isType<E extends Exception<ExceptionAttributes>>(
        this: new (...args: any) => E,
        value: unknown
    ): value is E {
        return value instanceof this;
    }

    private static get logger(): Logger {
        return Logger.instance;
    }
}
