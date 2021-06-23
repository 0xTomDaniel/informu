import { BehaviorSubject, Subscription } from "rxjs";
import AddMuTagInteractor, {
    AddMuTagInteractorException
} from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import ViewModel from "../../../shared/viewModel/ViewModel";
import assertUnreachable from "../../../shared/metaLanguage/assertUnreachable";

export type LowPriorityMessage = {
    messageKey: "FailedToSaveSettings";
    data: [];
};

export type MediumPriorityMessage =
    | {
          messageKey: "FailedToAddMuTag";
          data: [];
      }
    | {
          messageKey: "FailedToNameMuTag";
          data: [];
      }
    | {
          messageKey: "LowMuTagBattery";
          data: [number];
      }
    | {
          messageKey: "NewMuTagNotFound";
          data: [];
      };

type Route = typeof AddMuTagViewModel.routes[number];

export default class AddMuTagViewModel extends ViewModel<
    Route,
    undefined,
    LowPriorityMessage,
    MediumPriorityMessage
> {
    readonly showCancel = new BehaviorSubject<boolean>(true);
    get showCancelValue(): boolean {
        return this._showCancel.value;
    }
    readonly showCancelActivity = new BehaviorSubject<boolean>(false);
    get showCancelActivityValue(): boolean {
        return this._showCancelActivity.value;
    }
    readonly showRetry = new BehaviorSubject<boolean>(false);
    get showRetryValue(): boolean {
        return this._showRetry.value;
    }

    constructor(
        navigation: NavigationPort<Route>,
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
        this.hideProgressIndicator();
        this.showCancel.next(true);
        this.hideMediumPriorityMessage();
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
            this.hideMediumPriorityMessage();
        }
        this.showProgressIndicator("Indeterminate");
        await this.addMuTagInteractor
            .setMuTagName(name)
            .finally(() => this.hideProgressIndicator())
            .then(() => {
                this.hideMediumPriorityMessage();
                this.showRetry.next(false);
                this.hardwareBackPressSubscription?.unsubscribe();
                this.navigation.popToTop();
            })
            .catch(e => {
                if (AddMuTagInteractorException.isType(e)) {
                    this.handleException(e);
                } else {
                    throw e;
                }
            });
    }

    async startAddingMuTag(retry = false): Promise<void> {
        if (retry) {
            this.hideMediumPriorityMessage();
        }
        this.showProgressIndicator("Indeterminate");
        this.isFindingNewMuTag = true;
        await this.addMuTagInteractor
            .findNewMuTag()
            .then(() => {
                this.isFindingNewMuTag = false;
                this.showCancel.next(false);
                return this.addMuTagInteractor.addFoundMuTag();
            })
            .finally(() => this.hideProgressIndicator())
            .then(() => {
                this.showRetry.next(false);
                this.navigation.navigateTo("NameMuTag");
            })
            .catch(e => {
                this.isFindingNewMuTag = false;
                if (AddMuTagInteractorException.isType(e)) {
                    this.handleException(e);
                } else {
                    throw e;
                }
            });
    }

    private readonly addMuTagInteractor: AddMuTagInteractor;
    private hardwareBackPressSubscription: Subscription | undefined;
    private isFindingNewMuTag = false;
    private readonly _showCancel = new BehaviorSubject<boolean>(true);
    private readonly _showCancelActivity = new BehaviorSubject<boolean>(false);
    private readonly _showRetry = new BehaviorSubject<boolean>(false);

    private handleException(exception: AddMuTagInteractorException): void {
        switch (exception.attributes.type) {
            case "FailedToAddMuTag":
            case "FailedToNameMuTag":
            case "NewMuTagNotFound":
                this.showMediumPriorityMessage({
                    messageKey: exception.attributes.type,
                    data: exception.attributes.data
                });
                break;
            case "LowMuTagBattery":
                this.showMediumPriorityMessage({
                    messageKey: exception.attributes.type,
                    data: exception.attributes.data
                });
                break;
            case "FailedToSaveSettings":
                this.showLowPriorityMessage(
                    {
                        messageKey: exception.attributes.type,
                        data: exception.attributes.data
                    },
                    4
                );
                break;
            case "FindNewMuTagCanceled":
                return;
            default:
                assertUnreachable(exception.attributes);
        }
        this.showRetry.next(true);
    }

    static readonly routes = [
        "AddMuTagIntro",
        "FindAddMuTag",
        "NameMuTag"
    ] as const;
}
