import { BehaviorSubject } from "rxjs";
import { AddMuTagInteractor } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import UserError from "../../../shared/metaLanguage/UserError";

// TODO: This should be part of a view model base class file.
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

type Routes = typeof AddMuTagViewModel.routes[number];

export class AddMuTagViewModel extends ViewModel<Routes> {
    constructor(
        navigation: NavigationPort<Routes>,
        addMuTagInteractor: AddMuTagInteractor
    ) {
        super(navigation);
        this.addMuTagInteractor = addMuTagInteractor;
    }

    cancel(): void {}

    goToFindMuTag(): void {
        this.navigation.navigateTo("FindMuTag");
    }

    setMuTagName(name: string): void {
        this.showActivity.next(true);
        this.addMuTagInteractor
            .setMuTagName(name)
            .then(() => this.navigation.popToTop())
            .finally(() => this.showActivity.next(false));
    }

    startAddingMuTag(retry = false): void {
        if (retry) {
            this.showFailure.next(undefined);
        }
        this.showActivity.next(true);
        this.addMuTagInteractor
            .findNewMuTag()
            .then(() => this.addMuTagInteractor.addFoundMuTag())
            .then(() => this.navigation.navigateTo("NameMuTag"))
            .catch(e => {
                if (e instanceof UserError) {
                    this.showFailure.next(
                        This.createUserMessage(e.message, e.originatingError)
                    );
                }
            })
            .finally(() => this.showActivity.next(false));
    }

    private readonly addMuTagInteractor: AddMuTagInteractor;

    static readonly routes = ["FindMuTag", "NameMuTag"] as const;
}

const This = AddMuTagViewModel;
