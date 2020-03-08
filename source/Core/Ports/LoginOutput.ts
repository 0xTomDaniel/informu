import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";
import { SignedIntoOtherDevice } from "../Application/SessionService";

export default interface LoginOutput {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showHomeScreen(): void;
    showEmailLoginError(error: any): void;
    showSignedIntoOtherDevice(warning: SignedIntoOtherDevice): void;
    showFederatedLoginError(error: UserError): void;
    showMessage(message: string): void;
}
