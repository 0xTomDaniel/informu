export interface AddMuTagState {
    userErrorDescription: string;
    detailedErrorDescription: string;
    showError: boolean;
}

export class AddMuTagViewModel {
    private _userErrorDescription = "";
    private _detailedErrorDescription = "";
    private _showError = false;

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
    private onNavigateToNameMuTagCallback?: () => void;
    private onNavigateToHomeScreenCallback?: () => void;

    onDidUpdate(callback?: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToNameMuTag(callback?: () => void): void {
        this.onNavigateToNameMuTagCallback = callback;
    }

    navigateToNameMuTag(): void {
        this.onNavigateToNameMuTagCallback &&
            this.onNavigateToNameMuTagCallback();
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
