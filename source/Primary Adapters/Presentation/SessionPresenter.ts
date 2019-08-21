import { SessionOutput } from '../../Core/Ports/SessionOutput';
import LoadSessionViewModel from './LoadSessionViewModel';

export default class SessionPresenter implements SessionOutput {

    private readonly loadSessionViewModel: LoadSessionViewModel;

    constructor(loadSessionViewModel: LoadSessionViewModel) {
        this.loadSessionViewModel = loadSessionViewModel;
    }

    showHomeScreen(): void {
        this.loadSessionViewModel.navigateToApp();
    }

    showLoginScreen(): void {
        this.loadSessionViewModel.navigateToEntry();
    }
}
