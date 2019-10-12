export interface MuTagAddingState {

    errorDescription: string;
    showError: boolean;
}

export class MuTagAddingViewModel {

    private _errorDescription = '';
    private _showError = false;

    get errorDescription(): string {
        return this._errorDescription;
    }

    set errorDescription(newValue: string) {
        this._errorDescription = newValue;
        this.triggerDidUpdate({ errorDescription: newValue });
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
        this.onNavigateToMuTagSettingsCallback && this.onNavigateToMuTagSettingsCallback();
    }

    onNavigateToHomeScreen(callback?: () => void): void {
        this.onNavigateToHomeScreenCallback = callback;
    }

    navigateToHomeScreen(): void {
        this.onNavigateToHomeScreenCallback && this.onNavigateToHomeScreenCallback();
    }

    private triggerDidUpdate(change: object): void {
        if (this.onDidUpdateCallback != null) {
            this.onDidUpdateCallback(change);
        }
    }
}
