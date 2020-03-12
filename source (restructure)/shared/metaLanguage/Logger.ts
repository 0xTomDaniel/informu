import EventTracker from "./EventTracker";

export default class Logger {
    private readonly eventTracker: EventTracker;
    constructor(eventTracker: EventTracker) {
        this.eventTracker = eventTracker;
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
