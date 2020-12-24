import { BehaviorSubject, Subscription } from "rxjs";
import AddMuTagInteractor, {
    AddMuTagInteractorException
} from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
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
        this.hardwareBackPressSubscription?.unsubscribe();
        this.navigation.popToTop();
    }

    goToFindMuTag(): void {
        this.hardwareBackPressSubscription = this.navigation
            .onHardwareBackPress(true)
            .subscribe(() => {
                if (this.showCancel.value) {
                    this.cancel();
                }
            });
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
                this.hardwareBackPressSubscription?.unsubscribe();
                this.navigation.popToTop();
            })
            .catch(e => {
                if (e instanceof AddMuTagInteractorException) {
                    this.showFailure.next(
                        This.createUserMessage(e.name, e.message)
                    );
                    this.showRetry.next(true);
                    this.showActivity.next(false);
                } else {
                    throw e;
                }
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
                return this.addMuTagInteractor.addFoundMuTag();
            })
            .then(() => {
                this.showRetry.next(false);
                this.showActivity.next(false);
                this.navigation.navigateTo("NameMuTag");
            })
            .catch(e => {
                this.isFindingNewMuTag = false;
                if (e instanceof AddMuTagInteractorException) {
                    this.showFailure.next(
                        This.createUserMessage(e.name, e.message)
                    );
                    this.showRetry.next(true);
                    this.showActivity.next(false);
                } else {
                    throw e;
                }
            });
        // Cannot use 'finally' function of promise because navigation executes
        // before 'finally' does. This may cause a race condition where the view
        // that's being navigated to misses the observable being emitted from
        // 'finally' function.
    }

    private readonly addMuTagInteractor: AddMuTagInteractor;
    private hardwareBackPressSubscription: Subscription | undefined;
    private isFindingNewMuTag = false;

    static readonly routes = [
        "AddMuTagIntro",
        "FindAddMuTag",
        "NameMuTag"
    ] as const;
}

const This = AddMuTagViewModel;
