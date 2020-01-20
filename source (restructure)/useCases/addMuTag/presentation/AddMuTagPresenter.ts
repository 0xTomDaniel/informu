import { AddMuTagOutputPort } from "../AddMuTagOutputPort";
import { HomeViewModel } from "../../../../source/Primary Adapters/Presentation/HomeViewModel";
import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { LowMuTagBattery } from "../AddMuTagInteractor";
import {
    NewMuTagNotFound,
    ProvisionMuTagFailed,
    BluetoothUnsupported
} from "../MuTagDevicesPort";
import { NameMuTagViewModel } from "../../../../source/Primary Adapters/Presentation/NameMuTagViewModel";
import { MuTagAddingViewModel } from "../../../../source/Primary Adapters/Presentation/MuTagAddingViewModel";

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
            this.currentViewModel.errorDescription = "";
            this.currentViewModel.navigateToHomeScreen();
            this.currentViewModel = this.homeViewModel;
        }

        this.resetViewModelsToDefault();
    }

    showLowBatteryError(error: LowMuTagBattery): void {
        this.showErrorMessage(error.message);
    }

    showFindNewMuTagError(error: NewMuTagNotFound): void {
        this.showErrorMessage(error.message);
    }

    showProvisionFailedError(error: ProvisionMuTagFailed): void {
        this.showErrorMessage(error.message);
    }

    showBluetoothUnsupportedError(error: BluetoothUnsupported): void {
        this.showErrorMessage(error.message);
    }

    showError(error: Error): void {
        this.showErrorMessage(error.message);
    }

    private showErrorMessage(description: string): void {
        if (
            this.currentViewModel instanceof AddMuTagViewModel ||
            this.currentViewModel instanceof NameMuTagViewModel ||
            this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.errorDescription = description;
            this.currentViewModel.showError = true;
        }
    }

    private resetViewModelsToDefault(): void {
        this.nameMuTagViewModel.showActivityIndicator = false;
        this.nameMuTagViewModel.attachedToInput = "";
    }
}
