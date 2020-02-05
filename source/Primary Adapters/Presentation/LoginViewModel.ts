import _ from "lodash";

export interface LoginState {
    emailInput: string;
    passwordInput: string;
    emailErrorMessage: string;
    passwordErrorMessage: string;
    federatedErrorMessage: string;
    detailedErrorDescription: string;
    isBusy: boolean;
    logInButtonDisabled: boolean;
}

export interface LoginStateDelta {
    emailInput?: string;
    passwordInput?: string;
    emailErrorMessage?: string;
    passwordErrorMessage?: string;
    federatedErrorMessage?: string;
    detailedErrorDescription?: string;
    isBusy?: boolean;
    logInButtonDisabled?: boolean;
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
        logInButtonDisabled: false
    };

    get state(): LoginState {
        return this._state;
    }

    private onDidUpdateCallback?: (change: LoginState) => void;
    private onNavigateToAppCallback?: () => void;

    updateState(delta: LoginStateDelta): void {
        const oldState = _.cloneDeep(this._state);
        _.mergeWith(this._state, delta, (destValue, deltaValue):
            | any[]
            | undefined => {
            if (_.isArray(destValue)) {
                const merged = _.values(
                    _.merge(
                        _.keyBy(destValue, "uid"),
                        _.keyBy(deltaValue, "uid")
                    )
                );
                return _.intersectionBy(merged, deltaValue, "uid");
            }
        });
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
