import { BehaviorSubject } from "rxjs";
import NavigationPort from "../navigation/NavigationPort";

interface ViewModelUserMessage {
    message: string;
    details?: string;
}

export abstract class ViewModel<T extends string> {
    readonly showActivity = new BehaviorSubject<boolean>(false);
    readonly showFailure = new BehaviorSubject<
        ViewModelUserMessage | undefined
    >(undefined);
    readonly showSuccess = new BehaviorSubject<
        ViewModelUserMessage | undefined
    >(undefined);

    constructor(navigation: NavigationPort<T>) {
        this.navigation = navigation;
    }

    protected navigation: NavigationPort<T>;

    static createUserMessage(
        message: string,
        details?: unknown
    ): ViewModelUserMessage {
        const userMessage: ViewModelUserMessage = {
            message: message
        };
        if (details != null) {
            userMessage.details = JSON.stringify(
                details,
                Object.getOwnPropertyNames(details)
            );
        }
        return userMessage;
    }
}
