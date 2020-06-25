import { SignOutOutput } from "./SignOutOutput";
import BelongingDashboardViewModel from "../viewBelongingDashboard/presentation/BelongingDashboardViewModel";

export default class SignOutPresenter implements SignOutOutput {
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
