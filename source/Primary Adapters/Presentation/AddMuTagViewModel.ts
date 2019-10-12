export interface AddMuTagState {

    errorDescription: string;
    showError: boolean;
}

export class AddMuTagViewModel {

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

    private onDidUpdateCallback: ((change: object) => void) | undefined;
    private onNavigateToNameMuTagCallback: (() => void) | undefined;
    private onNavigateToHomeScreenCallback: (() => void) | undefined;

    onDidUpdate(callback: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToNameMuTag(callback: () => void): void {
        this.onNavigateToNameMuTagCallback = callback;
    }

    navigateToNameMuTag(): void {
        this.onNavigateToNameMuTagCallback && this.onNavigateToNameMuTagCallback();
    }

    onNavigateToHomeScreen(callback: () => void): void {
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
