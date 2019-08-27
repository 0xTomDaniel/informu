import SessionService from '../../Core/Application/SessionService';
import { AppState, AppStateStatus } from 'react-native';

export class AppStateController {
    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
        this.setupSessionReload();
    }

    private setupSessionReload(): void {
        AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    }

    private handleAppStateChange(state: AppStateStatus): void {
        if (state === 'active') {
            this.sessionService.load();
        }
    }
}
