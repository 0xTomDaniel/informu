import { LoginOutput } from '../../Core/Ports/LoginOutput';
import { LoginViewModel } from './LoginViewModel';
import { ImproperPasswordComplexity } from '../../Core/Application/LoginService';

export default class LoginPresenter implements LoginOutput {

    private readonly loginViewModel: LoginViewModel;

    constructor(loginViewModel: LoginViewModel) {
        this.loginViewModel = loginViewModel;
    }

    showBusyIndicator(): void {
        this.clearErrorMessages();
        this.loginViewModel.logInButtonDisabled = true;
        this.loginViewModel.isBusy = true;
    }

    showHomeScreen(): void {
        this.hideBusyIndicator();
        throw new Error('Need to show home screen.');
    }

    showLoginError(error: Error): void {
        this.clearErrorMessages();
        this.enableLogInButton();
        this.hideBusyIndicator();

        if (error instanceof ImproperPasswordComplexity) {
            this.loginViewModel.passwordErrorMessage = error.message;
        } else  {
            this.loginViewModel.emailErrorMessage = error.message;
        }
    }

    private hideBusyIndicator(): void {
        this.loginViewModel.isBusy = false;
    }

    private enableLogInButton(): void {
        this.loginViewModel.logInButtonDisabled = false;
    }

    private clearErrorMessages(): void {
        this.loginViewModel.passwordErrorMessage = '';
        this.loginViewModel.emailErrorMessage = '';
    }
}
