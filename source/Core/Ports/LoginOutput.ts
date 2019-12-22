export interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showLoginError(error: Error): void;
}
