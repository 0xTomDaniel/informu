import Account from "../Domain/Account";

export interface AccountRepositoryRemote {
    getByUid(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    removeByUid(uid: string): Promise<void>;
}

export class DoesNotExist extends Error {
    constructor() {
        super("Account entity does not exist in remote persistence.");
        this.name = "DoesNotExist";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends Error {
    constructor() {
        super("Failed to get account entity from remote persistence.");
        this.name = "FailedToGet";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class PersistedDataMalformed extends Error {
    constructor(json: string) {
        super(`Received malformed data from remote persistence:\n${json}`);
        this.name = "PersistedDataMalformed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToAdd extends Error {
    constructor() {
        super("Failed to add account entity to remote persistence.");
        this.name = "FailedToAdd";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToUpdate extends Error {
    constructor() {
        super("Failed to update account entity to remote persistence.");
        this.name = "FailedToUpdate";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToRemove extends Error {
    constructor() {
        super("Failed to remove account entity from remote persistence.");
        this.name = "FailedToRemove";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type AccountRepositoryRemoteException =
    | DoesNotExist
    | FailedToGet
    | PersistedDataMalformed
    | FailedToAdd
    | FailedToRemove;
