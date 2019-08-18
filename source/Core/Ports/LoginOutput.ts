export interface LoginOutput {

    showBusyIndicator(): void;
    showHomeScreen(): void;
    showLoginError(error: Error): void;
}
