import EventTracker from "./EventTracker";

export default class Logger {
    private static _instance: Logger;
    static get instance(): Logger {
        if (this._instance == null) {
            throw Error(
                "Logger instance does not exist. Please create it first."
            );
        }
        return this._instance;
    }
    private readonly eventTracker: EventTracker;

    private constructor(eventTracker: EventTracker) {
        this.eventTracker = eventTracker;
    }

    static createInstance(eventTracker: EventTracker): void {
        if (this._instance != null) {
            throw Error("Logger instance already exists.");
        }
        this._instance = new this(eventTracker);
    }

    log(message: unknown, report = false, toConsole = true): void {
        if (toConsole) {
            console.log(
                JSON.stringify(message, Object.getOwnPropertyNames(message))
            );
        }
        if (report) {
            this.eventTracker.log(message);
        }
    }

    warn(message: unknown, report = false, toConsole = true): void {
        if (toConsole) {
            console.warn(
                JSON.stringify(message, Object.getOwnPropertyNames(message))
            );
        }
        if (report) {
            this.eventTracker.warn(message);
        }
    }

    error(message: unknown, report = false, toConsole = true): void {
        if (toConsole) {
            console.error(
                JSON.stringify(message, Object.getOwnPropertyNames(message))
            );
        }
        if (report) {
            this.eventTracker.error(message);
        }
    }
}
