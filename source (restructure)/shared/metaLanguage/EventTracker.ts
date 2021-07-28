import * as Sentry from "@sentry/react-native";

// Had to decouple Sentry because Jest was unable to run with its import.

interface UserInfo {
    id: string;
    username: string;
    email: string;
}

export default interface EventTracker {
    log(message: any): void;
    warn(message: any): void;
    error(message: any): void;
    setUser(userInfo: UserInfo): void;
    removeUser(): void;
}

export class EventTrackerImpl implements EventTracker {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    log(message: any): void {
        Sentry.captureMessage(
            JSON.stringify(message, Object.getOwnPropertyNames(message)),
            Sentry.Severity.Info
        );
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    warn(message: any): void {
        Sentry.withScope(scope => {
            scope.setLevel(Sentry.Severity.Warning);
            Sentry.captureException(message);
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    error(message: any): void {
        Sentry.captureException(message);
    }

    setUser(userInfo: UserInfo): void {
        Sentry.configureScope(scope => {
            scope.setUser({
                id: userInfo.id,
                username: userInfo.username,
                email: userInfo.email
            });
        });
    }

    removeUser(): void {
        Sentry.configureScope(scope => scope.setUser(null));
    }
}
