import EventTracker from "./EventTracker";

export default class Logger {
    private static _instance: Logger;
    static get instance(): Logger {
        if (Logger._instance == null) {
            throw Error(
                "Logger instance does not exist. Please create it first."
            );
        }
        return Logger._instance;
    }
    private readonly eventTracker: EventTracker;

    private constructor(eventTracker: EventTracker) {
        this.eventTracker = eventTracker;
    }

    static createInstance(eventTracker: EventTracker): void {
        if (Logger._instance != null) {
            throw Error("Logger instance already exists.");
        }
        Logger._instance = new Logger(eventTracker);
    }

    log(message: any, report = false, toConsole = true): void {
        if (toConsole) {
            console.log(JSON.stringify(message));
        }
        if (report) {
            this.eventTracker.log(message);
        }
    }

    warn(message: any, report = false, toConsole = true): void {
        if (toConsole) {
            console.warn(JSON.stringify(message));
        }
        if (report) {
            this.eventTracker.warn(message);
        }
    }

    error(message: any, report = false, toConsole = true): void {
        if (toConsole) {
            console.error(JSON.stringify(message));
        }
        if (report) {
            this.eventTracker.error(message);
        }
    }
}