export interface NameMuTagState {

    attachedToInput: string;
    showActivityIndicator: boolean;
}

export class NameMuTagViewModel {

    private _attachedToInput = '';
    private _showActivityIndicator = false;

    get attachedToInput(): string {
        return this._attachedToInput;
    }

    set attachedToInput(newValue: string) {
        this._attachedToInput = newValue;
        this.triggerDidUpdate({ attachedToInput: newValue });
    }

    get showActivityIndicator(): boolean {
        return this._showActivityIndicator;
    }

    set showActivityIndicator(newValue: boolean) {
        this._showActivityIndicator = newValue;
        this.triggerDidUpdate({ showActivityIndicator: newValue });
    }

    private onDidUpdateCallback: ((change: object) => void) | undefined;
    private onNavigateToMuTagSettingsCallback: (() => void) | undefined;
    private onNavigateToMuTagAddingCallback: (() => void) | undefined;
    private onNavigateToHomeScreenCallback: (() => void) | undefined;

    onDidUpdate(callback: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToMuTagSettings(callback: () => void): void {
        this.onNavigateToMuTagSettingsCallback = callback;
    }

    navigateToMuTagSettings(): void {
        this.onNavigateToMuTagSettingsCallback && this.onNavigateToMuTagSettingsCallback();
    }

    onNavigateToMuTagAdding(callback: () => void): void {
        this.onNavigateToMuTagAddingCallback = callback;
    }

    navigateToMuTagAdding(): void {
        this.onNavigateToMuTagAddingCallback && this.onNavigateToMuTagAddingCallback();
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
