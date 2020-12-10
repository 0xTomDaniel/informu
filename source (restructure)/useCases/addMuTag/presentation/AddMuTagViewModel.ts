import { BehaviorSubject } from "rxjs";
import AddMuTagInteractor from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import UserError from "../../../shared/metaLanguage/UserError";
import UserWarning from "../../../shared/metaLanguage/UserWarning";
import ViewModel from "../../../shared/viewModel/ViewModel";

type Routes = typeof AddMuTagViewModel.routes[number];

export default class AddMuTagViewModel extends ViewModel<Routes> {
    readonly showCancel = new BehaviorSubject<boolean>(true);
    readonly showCancelActivity = new BehaviorSubject<boolean>(false);
    readonly showRetry = new BehaviorSubject<boolean>(false);

    constructor(
        navigation: NavigationPort<Routes>,
        addMuTagInteractor: AddMuTagInteractor
    ) {
        super(navigation);
        this.addMuTagInteractor = addMuTagInteractor;
    }

    async cancel(): Promise<void> {
        this.showCancelActivity.next(true);
        if (this.isFindingNewMuTag) {
            await this.addMuTagInteractor.stopFindingNewMuTag();
        }
        this.showActivity.next(false);
        this.showCancel.next(true);
        this.showFailure.next(undefined);
        this.showRetry.next(false);
        this.showCancelActivity.next(false);
        this.navigation.popToTop();
    }

    goToFindMuTag(): void {
        this.navigation.navigateTo("FindAddMuTag");
    }

    async setMuTagName(name: string, retry = false): Promise<void> {
        if (retry) {
            this.showFailure.next(undefined);
        }
        this.showActivity.next(true);
        await this.addMuTagInteractor
            .setMuTagName(name)
            .then(() => {
                this.showFailure.next(undefined);
                this.showRetry.next(false);
                this.showActivity.next(false);
                this.navigation.popToTop();
            })
            .catch(e => {
                const message =
                    e instanceof UserWarning
                        ? e.userFriendlyMessage
                        : JSON.stringify(e, Object.getOwnPropertyNames(e));
                this.showFailure.next(
                    This.createUserMessage(message, e.message)
                );
                this.showRetry.next(true);
                this.showActivity.next(false);
            });
        // Cannot use 'finally' function of promise because navigation executes
        // before 'finally' does. This may cause a race condition where the view
        // that's being navigated to misses the observable being emitted from
        // 'finally' function.
    }

    async startAddingMuTag(retry = false): Promise<void> {
        if (retry) {
            this.showFailure.next(undefined);
        }
        this.showActivity.next(true);
        this.isFindingNewMuTag = true;
        await this.addMuTagInteractor
            .findNewMuTag()
            .then(() => {
                this.isFindingNewMuTag = false;
                this.showCancel.next(false);
                this.addMuTagInteractor.addFoundMuTag();
            })
            .then(() => {
                this.showRetry.next(false);
                this.showActivity.next(false);
                this.navigation.navigateTo("NameMuTag");
            })
            .catch(e => {
                this.isFindingNewMuTag = false;
                const message =
                    e instanceof UserError
                        ? e.userFriendlyMessage
                        : JSON.stringify(e, Object.getOwnPropertyNames(e));
                this.showFailure.next(
                    This.createUserMessage(message, e.message)
                );
                this.showRetry.next(true);
                this.showActivity.next(false);
            });
        // Cannot use 'finally' function of promise because navigation executes
        // before 'finally' does. This may cause a race condition where the view
        // that's being navigated to misses the observable being emitted from
        // 'finally' function.
    }

    private readonly addMuTagInteractor: AddMuTagInteractor;
    private isFindingNewMuTag = false;

    static readonly routes = [
        "AddMuTagIntro",
        "FindAddMuTag",
        "NameMuTag"
    ] as const;
}

const This = AddMuTagViewModel;
