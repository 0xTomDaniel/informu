import _ from "lodash";

export enum Screen {
    Entry,
    App,
    LoadSession
}

export default class AppViewModel {
    private onNavigateCallback: ((screen: Screen) => void) | undefined;

    onNavigate(callback: ((screen: Screen) => void) | undefined): void {
        this.onNavigateCallback = callback;
    }

    navigateTo(screen: Screen): void {
        if (this.onNavigateCallback != null) {
            this.onNavigateCallback(screen);
        }
    }
}
