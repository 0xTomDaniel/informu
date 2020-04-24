import { RemoveMuTagOutputPort } from "../../../source (restructure)/useCases/removeMuTag/RemoveMuTagOutputPort";
import { BelongingDashboardViewModel } from "../../../source (restructure)/useCases/viewBelongingDashboard/presentation/BelongingDashboardViewModel";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

export default class RemoveMuTagPresenter implements RemoveMuTagOutputPort {
    private readonly viewModel: BelongingDashboardViewModel;

    constructor(viewModel: BelongingDashboardViewModel) {
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
