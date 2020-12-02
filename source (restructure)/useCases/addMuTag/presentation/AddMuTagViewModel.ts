import { BehaviorSubject } from "rxjs";
import { AddMuTagInteractor } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import UserError from "../../../shared/metaLanguage/UserError";
import UserWarning from "../../../shared/metaLanguage/UserWarning";
import { ViewModel } from "../../../shared/viewModel/ViewModel";

type Routes = typeof AddMuTagViewModel.routes[number];

export class AddMuTagViewModel extends ViewModel<Routes> {
    readonly showCancel = new BehaviorSubject<boolean>(true);
    readonly showCancelActivity = new BehaviorSubject<boolean>(false);

    constructor(
        navigation: NavigationPort<Routes>,
        addMuTagInteractor: AddMuTagInteractor
    ) {
        super(navigation);
        this.addMuTagInteractor = addMuTagInteractor;
    }

    cancel(): void {
        this.showCancelActivity.next(true);
        if (this.isFindingNewMuTag) {
            this.addMuTagInteractor.stopFindingNewMuTag();
        }
        this.navigation.popToTop();
        this.showCancelActivity.next(false);
    }

    goToFindMuTag(): void {
        this.navigation.navigateTo("FindMuTag");
    }

    setMuTagName(name: string, retry = false): void {
        if (retry) {
            this.showFailure.next(undefined);
        }
        this.showActivity.next(true);
        this.addMuTagInteractor
            .setMuTagName(name)
            .then(() => this.navigation.popToTop())
            .catch(e => {
                if (e instanceof UserWarning) {
                    this.showFailure.next(
                        This.createUserMessage(e.message, e.originatingError)
                    );
                }
            })
            .finally(() => this.showActivity.next(false));
    }

    startAddingMuTag(retry = false): void {
        if (retry) {
            this.showFailure.next(undefined);
        }
        this.showActivity.next(true);
        this.isFindingNewMuTag = true;
        this.addMuTagInteractor
            .findNewMuTag()
            .then(() => {
                this.isFindingNewMuTag = false;
                this.showCancel.next(false);
                this.addMuTagInteractor.addFoundMuTag();
            })
            .then(() => this.navigation.navigateTo("NameMuTag"))
            .catch(e => {
                this.isFindingNewMuTag = false;
                if (e instanceof UserError) {
                    this.showFailure.next(
                        This.createUserMessage(e.message, e.originatingError)
                    );
                }
            })
            .finally(() => this.showActivity.next(false));
    }

    private readonly addMuTagInteractor: AddMuTagInteractor;
    private isFindingNewMuTag = false;

    static readonly routes = ["FindMuTag", "NameMuTag"] as const;
}

const This = AddMuTagViewModel;
