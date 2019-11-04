import { LogoutOutput } from '../../Core/Ports/LogoutOutput';
import { HomeViewModel } from './HomeViewModel';

export default class LogoutPresenter implements LogoutOutput{

    private readonly viewModel: HomeViewModel;

    constructor(viewModel: HomeViewModel) {
        this.viewModel = viewModel;
    }

    showBusyIndicator(): void {
        this.viewModel.state.showActivityIndicator = true;
    }

    showLogoutComplete(): void {
        this.viewModel.showLogoutComplete();
        this.viewModel.state.showActivityIndicator = false;
    }
}
