export interface MuTagAddingState {
    userWarningDescription: string;
    detailedWarningDescription: string;
    showWarning: boolean;
    userErrorDescription: string;
    detailedErrorDescription: string;
    showError: boolean;
}

export class MuTagAddingViewModel {
    private _userWarningDescription = "";
    private _detailedWarningDescription = "";
    private _showWarning = false;
    private _userErrorDescription = "";
    private _detailedErrorDescription = "";
    private _showError = false;

    get userWarningDescription(): string {
        return this._userWarningDescription;
    }

    set userWarningDescription(newValue: string) {
        this._userWarningDescription = newValue;
        this.triggerDidUpdate({ userWarningDescription: newValue });
    }

    get detailedWarningDescription(): string {
        return this._detailedWarningDescription;
    }

    set detailedWarningDescription(newValue: string) {
        this._detailedWarningDescription = newValue;
        this.triggerDidUpdate({ detailedWarningDescription: newValue });
    }

    get showWarning(): boolean {
        return this._showWarning;
    }

    set showWarning(newValue: boolean) {
        this._showWarning = newValue;
        this.triggerDidUpdate({ showWarning: newValue });
    }

    get userErrorDescription(): string {
        return this._userErrorDescription;
    }

    set userErrorDescription(newValue: string) {
        this._userErrorDescription = newValue;
        this.triggerDidUpdate({ userErrorDescription: newValue });
    }

    get detailedErrorDescription(): string {
        return this._detailedErrorDescription;
    }

    set detailedErrorDescription(newValue: string) {
        this._detailedErrorDescription = newValue;
        this.triggerDidUpdate({ detailedErrorDescription: newValue });
    }

    get showError(): boolean {
        return this._showError;
    }

    set showError(newValue: boolean) {
        this._showError = newValue;
        this.triggerDidUpdate({ showError: newValue });
    }

    private onDidUpdateCallback?: (change: object) => void;
    private onNavigateToMuTagSettingsCallback?: () => void;
    private onNavigateToHomeScreenCallback?: () => void;

    onDidUpdate(callback?: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToMuTagSettings(callback?: () => void): void {
        this.onNavigateToMuTagSettingsCallback = callback;
    }

    navigateToMuTagSettings(): void {
        this.onNavigateToMuTagSettingsCallback &&
            this.onNavigateToMuTagSettingsCallback();
    }

    onNavigateToHomeScreen(callback?: () => void): void {
        this.onNavigateToHomeScreenCallback = callback;
    }

    navigateToHomeScreen(): void {
        this.onNavigateToHomeScreenCallback &&
            this.onNavigateToHomeScreenCallback();
    }

    private triggerDidUpdate(change: object): void {
        if (this.onDidUpdateCallback != null) {
            this.onDidUpdateCallback(change);
        }
    }
}
