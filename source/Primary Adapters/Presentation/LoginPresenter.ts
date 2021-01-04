import LoginOutput from "../../Core/Ports/LoginOutput";
import { LoginViewModel } from "./LoginViewModel";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

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

    showSignedIntoOtherDevice(exception: Exception<string>): void {
        this.viewModel.updateState({
            signedIntoOtherDeviceMessage: exception.message
        });
    }

    showFederatedLoginError(exception: Exception<string>): void {
        this.hideBusyIndicator();
        let detailedErrorDescription: string;
        if (exception.originatingException instanceof Error) {
            detailedErrorDescription = exception.originatingException.message;
        } else if (typeof exception.originatingException === "string") {
            detailedErrorDescription = exception.originatingException;
        } else {
            detailedErrorDescription = "";
        }
        this.viewModel.updateState({
            federatedUserErrorMessage: exception.message,
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
