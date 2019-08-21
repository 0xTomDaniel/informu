export enum Screen {
    Entry,
    App,
}

export default class LoadSessionViewModel {

    private onNavigateCallback: ((screen: Screen) => void) | undefined;

    onNavigate(callback: (screen: Screen) => void): void {
        this.onNavigateCallback = callback;
    }

    navigateToApp(): void {
        if (this.onNavigateCallback != null) {
            this.onNavigateCallback(Screen.App);
        }
    }

    navigateToEntry(): void {
        if (this.onNavigateCallback != null) {
            this.onNavigateCallback(Screen.Entry);
        }
    }
}
