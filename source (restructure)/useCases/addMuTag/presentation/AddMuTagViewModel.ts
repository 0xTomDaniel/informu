import { Observable } from "rxjs";
import { AddMuTagInteractor } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";

// TODO: This should be part of a view model base class file.
interface ViewModelUserMessage {
    message: string;
    details?: string;
}

export const addMuTagViewModelRoutes = ["FindMuTag"] as const;

type Routes = typeof addMuTagViewModelRoutes[number];

export class AddMuTagViewModel<T extends string = never> {
    showActivity: Observable<boolean>;
    showError: Observable<ViewModelUserMessage | undefined>;
    showMessage: Observable<ViewModelUserMessage | undefined>;

    constructor(
        navigation: NavigationPort<Routes | T>,
        addMuTagInteractor: AddMuTagInteractor
    ) {
        this.addMuTagInteractor = addMuTagInteractor;
        this.navigation = navigation;
    }

    cancel(): void {}

    goToFindMuTag(): void {
        this.navigation.navigateTo("FindMuTag");
    }

    setMuTagName(name: string): void {}

    startAddingMuTag(): void {}

    private addMuTagInteractor: AddMuTagInteractor;
    private navigation: NavigationPort<Routes | T>;
}
