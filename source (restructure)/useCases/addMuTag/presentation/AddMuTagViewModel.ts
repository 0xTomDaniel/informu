import { Observable } from "rxjs";
import { AddMuTagInteractor } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";

// TODO: This should be part of a view model base class file.
interface ViewModelUserMessage {
    message: string;
    details?: string;
}

abstract class ViewModel<T extends string> {
    constructor(navigation: NavigationPort<T>) {
        this.navigation = navigation;
    }

    protected navigation: NavigationPort<T>;
}

type Routes = typeof AddMuTagViewModel.routes[number];

export class AddMuTagViewModel extends ViewModel<Routes> {
    showActivity: Observable<boolean>;
    showError: Observable<ViewModelUserMessage | undefined>;
    showMessage: Observable<ViewModelUserMessage | undefined>;

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

    setMuTagName(name: string): void {}

    startAddingMuTag(): void {}

    private addMuTagInteractor: AddMuTagInteractor;

    static readonly routes = ["FindMuTag"] as const;
}
