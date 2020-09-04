import UserError from "../../shared/metaLanguage/UserError";
import UserWarning from "../../shared/metaLanguage/UserWarning";
import { AddMuTagWarning, AddMuTagError } from "./AddMuTagInteractor";

export default interface AddMuTagOutputPort {
    showMuTagNamingScreen(): void;
    showMuTagConnectingScreen(): void;
    showMuTagFinalSetupScreen(): void;
    showActivityIndicator(): void;
    showHomeScreen(): void;
    showWarning(warning: UserWarning<AddMuTagWarning>): void;
    showError(error: UserError<AddMuTagError>): void;
}
