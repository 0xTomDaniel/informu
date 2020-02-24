import AddMuTagOutputPort from "../AddMuTagOutputPort";
import { HomeViewModel } from "../../../../source/Primary Adapters/Presentation/HomeViewModel";
import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { NameMuTagViewModel } from "./NameMuTagViewModel";
import { MuTagAddingViewModel } from "./MuTagAddingViewModel";
import UserError from "../../../shared/metaLanguage/UserError";
import UserWarning from "../../../shared/metaLanguage/UserWarning";

type CurrentViewModel =
    | HomeViewModel
    | AddMuTagViewModel
    | NameMuTagViewModel
    | MuTagAddingViewModel;

export default class AddMuTagPresenter implements AddMuTagOutputPort {
    private readonly homeViewModel: HomeViewModel;
    private readonly addMuTagViewModel: AddMuTagViewModel;
    private readonly nameMuTagViewModel: NameMuTagViewModel;
    private readonly muTagAddingViewModel: MuTagAddingViewModel;
    private currentViewModel: CurrentViewModel;

    constructor(
        homeViewModel: HomeViewModel,
        addMuTagViewModel: AddMuTagViewModel,
        nameMuTagViewModel: NameMuTagViewModel,
        muTagAddingViewModel: MuTagAddingViewModel
    ) {
        this.homeViewModel = homeViewModel;
        this.addMuTagViewModel = addMuTagViewModel;
        this.nameMuTagViewModel = nameMuTagViewModel;
        this.muTagAddingViewModel = muTagAddingViewModel;
        this.currentViewModel = homeViewModel;
    }

    showAddMuTagScreen(): void {
        this.homeViewModel.navigateToAddMuTag();
        this.currentViewModel = this.addMuTagViewModel;
    }

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
            this.currentViewModel = this.homeViewModel;
        }

        this.resetViewModelsToDefault();
    }

    showWarning(warning: UserWarning): void {
        if (
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.userWarningDescription =
                warning.userWarningDescription;
            this.currentViewModel.detailedWarningDescription =
                warning.originatingError != null
                    ? JSON.stringify(warning.originatingError)
                    : "";
            this.currentViewModel.showWarning = true;
        }
    }

    showError(error: UserError): void {
        if (
            this.currentViewModel instanceof AddMuTagViewModel ||
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.userErrorDescription =
                error.userErrorDescription;
            this.currentViewModel.detailedErrorDescription =
                error.originatingError != null
                    ? String(error.originatingError)
                    : "";
            this.currentViewModel.showError = true;
        }
    }

    private resetViewModelsToDefault(): void {
        this.nameMuTagViewModel.showActivityIndicator = false;
        this.nameMuTagViewModel.attachedToInput = "";
    }
}
