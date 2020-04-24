import { LogoutOutput } from "../../Core/Ports/LogoutOutput";
import { BelongingDashboardViewModel } from "../../../source (restructure)/useCases/viewBelongingDashboard/presentation/BelongingDashboardViewModel";

export default class LogoutPresenter implements LogoutOutput {
    private readonly viewModel: BelongingDashboardViewModel;

    constructor(viewModel: BelongingDashboardViewModel) {
        this.viewModel = viewModel;
    }

    showBusyIndicator(): void {
        this.viewModel.updateState({ showActivityIndicator: true });
    }

    showLogoutComplete(): void {
        this.viewModel.showLogoutComplete();
        this.viewModel.updateState({ showActivityIndicator: false });
    }
}
