import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: any): void;
    showSignedIntoOtherDevice(warning: Exception<string>): void;
    showFederatedLoginError(error: Exception<string>): void;
    showMessage(message: string): void;
}
