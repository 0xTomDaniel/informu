import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: any): void;
    showFederatedLoginError(error: UserError): void;
    showMessage(message: string): void;
}
