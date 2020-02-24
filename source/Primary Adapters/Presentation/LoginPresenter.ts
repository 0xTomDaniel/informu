import LoginOutput from "../../Core/Ports/LoginOutput";
import { LoginViewModel } from "./LoginViewModel";
import { ImproperPasswordComplexity } from "../../Core/Application/LoginService";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";
import { SignedIntoOtherDevice } from "../../Core/Application/SessionService";

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

        if (error instanceof ImproperPasswordComplexity) {
            this.viewModel.updateState({ passwordErrorMessage: error.message });
        } else {
            this.viewModel.updateState({
                emailErrorMessage: error.message
            });
        }
    }

    showSignedIntoOtherDevice(warning: SignedIntoOtherDevice): void {
        this.viewModel.updateState({
            signedIntoOtherDeviceMessage: warning.userWarningDescription
        });
    }

    showFederatedLoginError(error: UserError): void {
        this.hideBusyIndicator();
        this.viewModel.updateState({
            federatedUserErrorMessage: error.userErrorDescription,
            detailedErrorDescription:
                error.originatingError?.message ??
                error.originatingError?.userErrorDescription ??
                ""
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
