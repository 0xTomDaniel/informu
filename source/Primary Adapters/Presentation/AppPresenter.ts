import { SessionOutput } from "../../Core/Ports/SessionOutput";
import AppViewModel, { Screen } from "./AppViewModel";

export default class AppPresenter implements SessionOutput {
    private readonly loadSessionViewModel: AppViewModel;

    constructor(loadSessionViewModel: AppViewModel) {
        this.loadSessionViewModel = loadSessionViewModel;
    }

    showHomeScreen(): void {
        this.loadSessionViewModel.navigateTo(Screen.App);
    }

    showLoginScreen(): void {
        this.loadSessionViewModel.navigateTo(Screen.Entry);
    }

    showLoadSessionScreen(): void {
        this.loadSessionViewModel.navigateTo(Screen.LoadSession);
    }
}
