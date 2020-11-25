import { Observable } from "rxjs";
import { AddMuTagInteractor } from "../AddMuTagInteractor";

// TODO: This should be part of a view model base class file.
interface ViewModelUserMessage {
    message: string;
    details?: string;
}

export class AddMuTagViewModel {
    showActivity: Observable<boolean>;
    showError: Observable<ViewModelUserMessage | undefined>;
    showMessage: Observable<ViewModelUserMessage | undefined>;

    constructor(addMuTagInteractor: AddMuTagInteractor) {
        this.addMuTagInteractor = addMuTagInteractor;
    }

    cancel(): void {}

    goToFindMuTag(): void {}

    setMuTagName(name: string): void {}

    startAddingMuTag(): void {}

    private addMuTagInteractor: AddMuTagInteractor;
}
