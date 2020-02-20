import _ from "lodash";

export interface LoginState {
    readonly emailInput: string;
    readonly passwordInput: string;
    readonly emailErrorMessage: string;
    readonly passwordErrorMessage: string;
    readonly federatedErrorMessage: string;
    readonly detailedErrorDescription: string;
    readonly isBusy: boolean;
    readonly logInButtonDisabled: boolean;
    readonly message: string;
}

export interface LoginStateDelta {
    readonly emailInput?: string;
    readonly passwordInput?: string;
    readonly emailErrorMessage?: string;
    readonly passwordErrorMessage?: string;
    readonly federatedErrorMessage?: string;
    readonly detailedErrorDescription?: string;
    readonly isBusy?: boolean;
    readonly logInButtonDisabled?: boolean;
    readonly message?: string;
}

export class LoginViewModel {
    private _state: LoginState = {
        emailInput: "",
        passwordInput: "",
        emailErrorMessage: "",
        passwordErrorMessage: "",
        federatedErrorMessage: "",
        detailedErrorDescription: "",
        isBusy: false,
        logInButtonDisabled: false,
        message: ""
    };

    get state(): LoginState {
        return this._state;
    }

    private onDidUpdateCallback?: (change: LoginState) => void;
    private onNavigateToAppCallback?: () => void;

    updateState(delta: LoginStateDelta): void {
        const oldState = _.cloneDeep(this._state);
        _.mergeWith(this._state, delta);
        if (!_.isEqual(this._state, oldState)) {
            this.triggerDidUpdate();
        }
    }

    onDidUpdate(callback?: (change: LoginState) => void): void {
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

    private triggerDidUpdate(): void {
        const newState = _.cloneDeep(this._state);
        this.onDidUpdateCallback?.(newState);
    }
}
