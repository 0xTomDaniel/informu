export class AddMuTagViewModel {

    private onNavigateToNameMuTagCallback: (() => void) | undefined;
    private onNavigateToHomeScreenCallback: (() => void) | undefined;

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
}
