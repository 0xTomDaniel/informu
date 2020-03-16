import { RemoveMuTagOutputPort } from "../../../source (restructure)/useCases/removeMuTag/RemoveMuTagOutputPort";
import { HomeViewModel } from "./HomeViewModel";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

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

    showError(error: UserError): void {
        this.viewModel.updateState({
            errorDescription: error.userFriendlyMessage,
            isErrorVisible: true
        });
    }
}
