import Account from "../Domain/Account";
import { UserErrorType } from "../../../source (restructure)/shared/metaLanguage/UserError";

export interface AccountRepositoryRemote {
    getByUid(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    removeByUid(uid: string): Promise<void>;
}

export const DoesNotExist: UserErrorType = {
    name: "DoesNotExist",
    userFriendlyMessage: "Account entity does not exist in remote persistence."
};

export const FailedToGet: UserErrorType = {
    name: "FailedToGet",
    userFriendlyMessage: "Failed to get account entity from remote persistence."
};

export const PersistedDataMalformed = (json: string): UserErrorType => ({
    name: "PersistedDataMalformed",
    userFriendlyMessage: `Received malformed data from remote persistence:\n${json}`
});

export const FailedToAdd: UserErrorType = {
    name: "FailedToAdd",
    userFriendlyMessage: "Failed to add account entity to remote persistence."
};

export const FailedToUpdate: UserErrorType = {
    name: "FailedToUpdate",
    userFriendlyMessage:
        "Failed to update account entity to remote persistence."
};

export const FailedToRemove: UserErrorType = {
    name: "FailedToRemove",
    userFriendlyMessage:
        "Failed to remove account entity from remote persistence."
};
