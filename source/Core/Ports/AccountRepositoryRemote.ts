import Account from "../Domain/Account";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

export interface AccountRepositoryRemote {
    getByUid(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    removeByUid(uid: string): Promise<void>;
}

export class DoesNotExist extends UserError {
    name = "DoesNotExist";
    userErrorDescription =
        "Account entity does not exist in remote persistence.";
    constructor() {
        super();
        this.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends UserError {
    name = "FailedToGet";
    userErrorDescription =
        "Failed to get account entity from remote persistence.";
    constructor() {
        super();
        this.name = "FailedToGet";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class PersistedDataMalformed extends UserError {
    name = "PersistedDataMalformed";
    userErrorDescription: string;
    constructor(json: string, originatingError?: Error | undefined) {
        super(originatingError);
        this.userErrorDescription = `Received malformed data from remote persistence:\n${json}`;
    }
}

export class FailedToAdd extends UserError {
    name = "FailedToAdd";
    userErrorDescription =
        "Failed to add account entity to remote persistence.";
}

export class FailedToUpdate extends UserError {
    name = "FailedToUpdate";
    userErrorDescription =
        "Failed to update account entity to remote persistence.";
}

export class FailedToRemove extends UserError {
    name = "FailedToRemove";
    userErrorDescription =
        "Failed to remove account entity from remote persistence.";
}

export type AccountRepositoryRemoteException =
    | DoesNotExist
    | FailedToGet
    | PersistedDataMalformed
    | FailedToAdd
    | FailedToRemove;
