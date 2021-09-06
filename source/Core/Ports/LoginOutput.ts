import Exception, {
    ExceptionAttributes
} from "../../../source (restructure)/shared/metaLanguage/Exception";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: any): void;
    showSignedIntoOtherDevice(warning: Exception<ExceptionAttributes>): void;
    showFederatedLoginError(error: Exception<ExceptionAttributes>): void;
    showMessage(message: string): void;
}
