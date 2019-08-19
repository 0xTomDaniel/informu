import { Account } from '../Domain/Account';

export interface AccountRepositoryRemote {

    getByUID(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
    removeByUID(uid: string): Promise<void>;
}

export class DoesNotExist extends Error {
    constructor() {
        super('Account entity does not exist in remote persistence.');
        this.name = 'DoesNotExist';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends Error {
    constructor() {
        super('Failed to get account entity from remote persistence.');
        this.name = 'FailedToGet';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class PersistedDataMalformed extends Error {
    constructor() {
        super('Failed to remove account entity from remote persistence.');
        this.name = 'PersistedDataMalformed';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToAdd extends Error {
    constructor() {
        super('Failed to add account entity to remote persistence.');
        this.name = 'FailedToAdd';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToRemove extends Error {
    constructor() {
        super('Failed to remove account entity from remote persistence.');
        this.name = 'FailedToRemove';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type AccountRepositoryRemoteException
    = DoesNotExist | FailedToGet | PersistedDataMalformed | FailedToAdd | FailedToRemove;