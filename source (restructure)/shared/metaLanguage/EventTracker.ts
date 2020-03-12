import * as Sentry from "@sentry/react-native";

// Had to decouple Sentry because Jest was unable to run with its import.

export default interface EventTracker {
    log(message: any): void;
    warn(message: any): void;
    error(message: any): void;
}

export class EventTrackerImpl implements EventTracker {
    log(message: any): void {
        Sentry.captureMessage(JSON.stringify(message), Sentry.Severity.Info);
    }

    warn(message: any): void {
        Sentry.withScope(scope => {
            scope.setLevel(Sentry.Severity.Warning);
            Sentry.captureException(message);
        });
    }

    error(message: any): void {
        Sentry.captureException(message);
    }
}
