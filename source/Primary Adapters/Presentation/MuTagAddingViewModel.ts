export class MuTagAddingViewModel {
    private onNavigateToMuTagSettingsCallback: (() => void) | undefined;
    private onNavigateToHomeScreenCallback: (() => void) | undefined;

    onNavigateToMuTagSettings(callback: () => void): void {
        this.onNavigateToMuTagSettingsCallback = callback;
    }

    navigateToMuTagSettings(): void {
        this.onNavigateToMuTagSettingsCallback && this.onNavigateToMuTagSettingsCallback();
    }

    onNavigateToHomeScreen(callback: () => void): void {
        this.onNavigateToHomeScreenCallback = callback;
    }

    navigateToHomeScreen(): void {
        this.onNavigateToHomeScreenCallback && this.onNavigateToHomeScreenCallback();
    }
}
