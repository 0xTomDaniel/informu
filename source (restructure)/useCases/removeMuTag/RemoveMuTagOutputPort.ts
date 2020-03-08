import UserError from "../../shared/metaLanguage/UserError";

export interface RemoveMuTagOutputPort {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showError(error: UserError): void;
}
