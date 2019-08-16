// Just fucking around right now

export class LoginViewModel {

    private onSetStateCallback: (() => void) | undefined;

    state: LoginViewModelState = {
        emailErrorMessage: '',
        passwordErrorMessage: '',
    }

    onDidUpdate(callback: () => void): void {
        this.onSetStateCallback = callback;
    }

    triggerDidUpdate(): void {
        if (this.onSetStateCallback != null) {
            this.onSetStateCallback();
        }
    }
}

export interface LoginViewModelState {

    emailErrorMessage: string;
    passwordErrorMessage: string;
}
