export class AddMuTagViewModel {

    private onNavigateToNameMuTagCallback: (() => void) | undefined;
    private onBackCallback: (() => void) | undefined;

    onNavigateToNameMuTag(callback: () => void): void {
        this.onNavigateToNameMuTagCallback = callback;
    }

    navigateToNameMuTag(): void {
        this.onNavigateToNameMuTagCallback && this.onNavigateToNameMuTagCallback();
    }

    onBack(callback: () => void): void {
        this.onBackCallback = callback;
    }

    goBack(): void {
        this.onBackCallback && this.onBackCallback();
    }
}
