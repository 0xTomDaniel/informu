export interface LoginState {

    emailInput: string;
    passwordInput: string;
    emailErrorMessage: string;
    passwordErrorMessage: string;
    isBusy: boolean;
    logInButtonDisabled: boolean;
}

export class LoginViewModel implements LoginState {

    private _emailInput = '';
    private _passwordInput = '';
    private _emailErrorMessage = '';
    private _passwordErrorMessage = '';
    private _isBusy = false;
    private _logInButtonDisabled = false;

    get emailInput(): string {
        return this._emailInput;
    }

    set emailInput(newValue: string) {
        this._emailInput = newValue;
        this.triggerDidUpdate({ emailInput: newValue });
    }

    get passwordInput(): string {
        return this._passwordInput;
    }

    set passwordInput(newValue: string) {
        this._passwordInput = newValue;
        this.triggerDidUpdate({ passwordInput: newValue });
    }

    get emailErrorMessage(): string {
        return this._emailErrorMessage;
    }

    set emailErrorMessage(newValue: string) {
        this._emailErrorMessage = newValue;
        this.triggerDidUpdate({ emailErrorMessage: newValue });
    }

    get passwordErrorMessage(): string {
        return this._passwordErrorMessage;
    }

    set passwordErrorMessage(newValue: string) {
        this._passwordErrorMessage = newValue;
        this.triggerDidUpdate({ passwordErrorMessage: newValue });
    }

    get isBusy(): boolean {
        return this._isBusy;
    }

    set isBusy(newValue: boolean) {
        this._isBusy = newValue;
        this.triggerDidUpdate({ isBusy: newValue });
    }

    get logInButtonDisabled(): boolean {
        return this._logInButtonDisabled;
    }

    set logInButtonDisabled(newValue: boolean) {
        this._logInButtonDisabled = newValue;
        this.triggerDidUpdate({ logInButtonDisabled: newValue });
    }

    private onDidUpdateCallback?: (change: object) => void;
    private onNavigateToAppCallback?: () => void;

    onDidUpdate(callback?: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToApp(callback?: () => void): void {
        this.onNavigateToAppCallback = callback;
    }

    navigateToApp(): void {
        if (this.onNavigateToAppCallback != null) {
            this.onNavigateToAppCallback();
        }
    }

    private triggerDidUpdate(change: object): void {
        if (this.onDidUpdateCallback != null) {
            this.onDidUpdateCallback(change);
        }
    }
}
