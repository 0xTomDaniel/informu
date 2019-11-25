import { RemoveMuTagOutput } from '../../Core/Ports/RemoveMuTagOutput';
import { HomeViewModel } from './HomeViewModel';
import { MuTagNotFound, UnprovisionMuTagFailed } from '../../Core/Ports/MuTagDevices';
import { LowMuTagBattery } from '../../Core/Application/AddMuTagService';

export default class RemoveMuTagPresenter implements RemoveMuTagOutput {

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
            isErrorVisible: true,
        });
    }
}
