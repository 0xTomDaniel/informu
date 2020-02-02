import UserError from "../../shared/metaLanguage/UserError";
import UserWarning from "../../shared/metaLanguage/UserWarning";

export default interface AddMuTagOutputPort {
    showAddMuTagScreen(): void;
    showMuTagNamingScreen(): void;
    showMuTagConnectingScreen(): void;
    showMuTagFinalSetupScreen(): void;
    showActivityIndicator(): void;
    showHomeScreen(): void;
    showWarning(warning: UserWarning): void;
    showError(error: UserError): void;
}
