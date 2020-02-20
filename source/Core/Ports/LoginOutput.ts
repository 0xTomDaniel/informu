import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: Error): void;
    showFederatedLoginError(error: UserError): void;
    showSignedOutMessage(message: string): void;
}
