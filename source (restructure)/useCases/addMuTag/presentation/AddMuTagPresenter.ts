import AddMuTagOutputPort from "../AddMuTagOutputPort";
import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { NameMuTagViewModel } from "./NameMuTagViewModel";
import { MuTagAddingViewModel } from "./MuTagAddingViewModel";
import UserError from "../../../shared/metaLanguage/UserError";
import UserWarning from "../../../shared/metaLanguage/UserWarning";
import { AddMuTagWarning, AddMuTagError } from "../AddMuTagInteractor";
import Localize from "../../../shared/localization/Localize";
import { template } from "lodash";

type CurrentViewModel =
    | AddMuTagViewModel
    | NameMuTagViewModel
    | MuTagAddingViewModel;

export default class AddMuTagPresenter implements AddMuTagOutputPort {
    //private readonly homeViewModel: BelongingDashboardViewModel;
    private readonly addMuTagViewModel: AddMuTagViewModel;
    private readonly nameMuTagViewModel: NameMuTagViewModel;
    private readonly muTagAddingViewModel: MuTagAddingViewModel;
    private currentViewModel: CurrentViewModel;

    constructor(
        //homeViewModel: BelongingDashboardViewModel,
        addMuTagViewModel: AddMuTagViewModel,
        nameMuTagViewModel: NameMuTagViewModel,
        muTagAddingViewModel: MuTagAddingViewModel
    ) {
        //this.homeViewModel = homeViewModel;
        this.addMuTagViewModel = addMuTagViewModel;
        this.nameMuTagViewModel = nameMuTagViewModel;
        this.muTagAddingViewModel = muTagAddingViewModel;
        this.currentViewModel = addMuTagViewModel;
    }

    /*showAddMuTagScreen(): void {
        this.homeViewModel.navigateToAddMuTag();
        this.currentViewModel = this.addMuTagViewModel;
    }*/

    showMuTagNamingScreen(): void {
        this.addMuTagViewModel.navigateToNameMuTag();
        this.currentViewModel = this.nameMuTagViewModel;
    }

    showMuTagConnectingScreen(): void {
        this.nameMuTagViewModel.navigateToMuTagAdding();
    }

    showMuTagFinalSetupScreen(): void {
        if (
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.navigateToMuTagSettings();
        }
    }

    showActivityIndicator(): void {
        if (this.currentViewModel instanceof NameMuTagViewModel) {
            this.currentViewModel.showActivityIndicator = true;
        }
    }

    showHomeScreen(): void {
        if (
            this.currentViewModel instanceof AddMuTagViewModel ||
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.showError = false;
            this.currentViewModel.userErrorDescription = "";
            this.currentViewModel.detailedErrorDescription = "";
            this.currentViewModel.navigateToHomeScreen();
            this.currentViewModel = this.addMuTagViewModel;
        }

        this.resetViewModelsToDefault();
    }

    showWarning(warning: UserWarning<AddMuTagWarning>): void {
        if (
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            const message = Localize.instance.getText(
                "addMuTag",
                "warning",
                warning.type.name
            );
            this.currentViewModel.userWarningDescription = message;
            this.currentViewModel.detailedWarningDescription = warning.details;
            this.currentViewModel.showWarning = true;
        }
    }

    showError(error: UserError<AddMuTagError>): void {
        let message: string;
        switch (error.type.name) {
            case "lowMuTagBattery":
                message = template(
                    Localize.instance.getText(
                        "addMuTag",
                        "error",
                        error.type.name
                    )
                )({ lowBatteryThreshold: error.type.lowBatteryThreshold });
                break;
            default:
                message = Localize.instance.getText(
                    "addMuTag",
                    "error",
                    error.type.name
                );
        }
        if (
            this.currentViewModel instanceof AddMuTagViewModel ||
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.userErrorDescription = message;
            this.currentViewModel.detailedErrorDescription = error.details;
            this.currentViewModel.showError = true;
        }
    }

    private resetViewModelsToDefault(): void {
        this.nameMuTagViewModel.showActivityIndicator = false;
        this.nameMuTagViewModel.attachedToInput = "";
    }
}
