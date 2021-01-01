import LoginOutput from "../../Core/Ports/LoginOutput";
import { LoginViewModel } from "./LoginViewModel";

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

    showEmailLoginError(error: Error): void {
        this.clearErrorMessages();
        this.enableLogInButton();
        this.hideBusyIndicator();

        if (error.name === "ImproperPasswordComplexity") {
            this.viewModel.updateState({ passwordErrorMessage: error.message });
        } else {
            this.viewModel.updateState({
                emailErrorMessage: error.message
            });
        }
    }

    showSignedIntoOtherDevice(warning: UserWarning): void {
        this.viewModel.updateState({
            signedIntoOtherDeviceMessage: warning.userFriendlyMessage
        });
    }

    showFederatedLoginError(error: UserError): void {
        this.hideBusyIndicator();
        let detailedErrorDescription: string;
        if (error.originatingError instanceof Error) {
            detailedErrorDescription = error.originatingError.message;
        } else if (typeof error.originatingError === "string") {
            detailedErrorDescription = error.originatingError;
        } else {
            detailedErrorDescription = "";
        }
        this.viewModel.updateState({
            federatedUserErrorMessage: error.userFriendlyMessage,
            detailedErrorDescription: detailedErrorDescription
        });
    }

    showMessage(message: string): void {
        this.viewModel.updateState({
            message: message
        });
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
