import Account from "../Domain/Account";
import { UserErrorType } from "../../../source (restructure)/shared/metaLanguage/UserError";

export interface AccountRepositoryLocal {
    get(): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    remove(): Promise<void>;
}

export const DoesNotExist: UserErrorType = {
    name: "DoesNotExist",
    userFriendlyMessage: "Account entity does not exist in local persistence."
};

export const FailedToGet: UserErrorType = {
    name: "FailedToGet",
    userFriendlyMessage: "Failed to get account entity from local persistence."
};

export const FailedToAdd: UserErrorType = {
    name: "FailedToAdd",
    userFriendlyMessage: "Failed to add account entity to local persistence."
};

export const FailedToUpdate: UserErrorType = {
    name: "FailedToUpdate",
    userFriendlyMessage: "Failed to update account entity to local persistence."
};

export const FailedToRemove: UserErrorType = {
    name: "FailedToRemove",
    userFriendlyMessage:
        "Failed to remove account entity from local persistence."
};
