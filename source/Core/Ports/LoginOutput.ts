export interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: Error): void;
    showFederatedLoginError(error: Error): void;
}
