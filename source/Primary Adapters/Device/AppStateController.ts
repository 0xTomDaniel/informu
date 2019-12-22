import SessionService from "../../Core/Application/SessionService";
import { AppState, AppStateStatus } from "react-native";

export class AppStateController {
    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
        this.setupSessionReload();
    }

    destructor(): void {
        AppState.removeEventListener("change", this.handleAppStateChange);
    }

    private setupSessionReload(): void {
        AppState.addEventListener("change", this.handleAppStateChange);
    }

    private readonly handleAppStateChange = (state: AppStateStatus): void => {
        if (state === "active") {
            this.sessionService.load();
        }
    };
}
