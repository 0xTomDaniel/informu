export interface HomeState {

    showAddMuTagTooltip: boolean;
}

export class HomeViewModel implements HomeState {

    private _showAddMuTagTooltip = true;

    get showAddMuTagTooltip(): boolean {
        return this._showAddMuTagTooltip;
    }

    set showAddMuTagTooltip(newValue: boolean) {
        this._showAddMuTagTooltip = newValue;
        this.triggerDidUpdate({ showAddMuTagTooltip: newValue });
    }

    private onDidUpdateCallback: ((change: object) => void) | undefined;
    private onNavigateToAddMuTagCallback: (() => void) | undefined;

    onDidUpdate(callback: (change: object) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToAddMuTag(callback: () => void): void {
        this.onNavigateToAddMuTagCallback = callback;
    }

    navigateToAddMuTag(): void {
        if (this.onNavigateToAddMuTagCallback != null) {
            this.onNavigateToAddMuTagCallback();
        } else {
            console.log('shit...');
        }
    }

    private triggerDidUpdate(change: object): void {
        if (this.onDidUpdateCallback != null) {
            this.onDidUpdateCallback(change);
        }
    }
}
