import { LoginOutput } from "../../Core/Ports/LoginOutput";
import { LoginViewModel } from "./LoginViewModel";
import { ImproperPasswordComplexity } from "../../Core/Application/LoginService";

export default class LoginPresenter implements LoginOutput {
    private readonly viewModel: LoginViewModel;

    constructor(viewModel: LoginViewModel) {
        this.viewModel = viewModel;
    }

    showBusyIndicator(): void {
        this.clearErrorMessages();
        this.viewModel.updateState({ logInButtonDisabled: true, isBusy: true });
    }

    hideBusyIndicator(): void {
        this.viewModel.updateState({ isBusy: false });
    }

    showHomeScreen(): void {
        this.hideBusyIndicator();
        this.viewModel.navigateToApp();
    }

    showLoginError(error: Error): void {
        this.clearErrorMessages();
        this.enableLogInButton();
        this.hideBusyIndicator();

        if (error instanceof ImproperPasswordComplexity) {
            this.viewModel.updateState({ passwordErrorMessage: error.message });
        } else {
            this.viewModel.updateState({ emailErrorMessage: error.message });
        }
    }

    private enableLogInButton(): void {
        this.viewModel.updateState({ logInButtonDisabled: false });
    }

    private clearErrorMessages(): void {
        this.viewModel.updateState({
            passwordErrorMessage: "",
            emailErrorMessage: ""
        });
    }
}
