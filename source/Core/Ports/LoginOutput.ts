import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";
import UserWarning from "../../../source (restructure)/shared/metaLanguage/UserWarning";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: any): void;
    showSignedIntoOtherDevice(warning: UserWarning): void;
    showFederatedLoginError(error: UserError): void;
    showMessage(message: string): void;
}
