import ProvisionedMuTag from "../Domain/ProvisionedMuTag";
import { AccountNumber } from "../Domain/Account";

export class DoesNotExist extends Error {
    constructor() {
        super("Mu tag entity does not exist in remote persistence.");
        this.name = "DoesNotExist";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends Error {
    constructor() {
        super("Failed to get Mu tag entity from remote persistence.");
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
        super("Failed to add Mu tag entity to remote persistence.");
        this.name = "FailedToAdd";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToUpdate extends Error {
    constructor() {
        super("Failed to update Mu tag entity to remote persistence.");
        this.name = "FailedToUpdate";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToRemove extends Error {
    constructor() {
        super("Failed to remove Mu tag entity from remote persistence.");
        this.name = "FailedToRemove";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface MuTagRepositoryRemote {
    getAll(accountUid: string): Promise<Set<ProvisionedMuTag>>;
    add(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    update(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    updateMultiple(
        muTags: Set<ProvisionedMuTag>,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    removeByUid(uid: string, accountUid: string): Promise<void>;
}
