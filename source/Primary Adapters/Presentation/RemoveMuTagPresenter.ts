import { RemoveMuTagOutputPort } from "../../../source (restructure)/useCases/removeMuTag/RemoveMuTagOutputPort";
import { HomeViewModel } from "./HomeViewModel";
import {
    MuTagNotFound,
    UnprovisionMuTagFailed
} from "../../../source (restructure)/useCases/addMuTag/MuTagDevicesPort";
import { LowMuTagBattery } from "../../../source (restructure)/useCases/addMuTag/AddMuTagInteractor";

export default class RemoveMuTagPresenter implements RemoveMuTagOutputPort {
    private readonly viewModel: HomeViewModel;

    constructor(viewModel: HomeViewModel) {
        this.viewModel = viewModel;
    }

    showBusyIndicator(): void {
        this.viewModel.updateState({ showActivityIndicator: true });
    }

    hideBusyIndicator(): void {
        this.viewModel.updateState({ showActivityIndicator: false });
    }

    showMuTagNotFoundError(error: MuTagNotFound): void {
        this.showError(error.message);
    }

    showUnprovisionMuTagFailedError(error: UnprovisionMuTagFailed): void {
        this.showError(error.message);
    }

    showLowBatteryError(error: LowMuTagBattery): void {
        this.showError(error.message);
    }

    showUnknownError(error: Error): void {
        this.showError(error.message);
    }

    private showError(message: string): void {
        this.viewModel.updateState({
            errorDescription: message,
            isErrorVisible: true
        });
    }
}
