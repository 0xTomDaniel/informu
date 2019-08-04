import { Account } from '../Domain/Account';

export interface AccountRepositoryLocal {

    get(): Promise<Account>;
    add(account: Account): Promise<void>;
    remove(): Promise<void>;
}

export class DoesNotExist extends Error {
    constructor() {
        super('Account entity does not exist in local persistence.');
        this.name = 'DoesNotExist';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends Error {
    constructor() {
        super('Failed to get account entity from local persistence.');
        this.name = 'FailedToGet';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToAdd extends Error {
    constructor() {
        super('Failed to add account entity to local persistence.');
        this.name = 'FailedToAdd';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToRemove extends Error {
    constructor() {
        super('Failed to remove account entity from local persistence.');
        this.name = 'FailedToRemove';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type AccountRepositoryLocalException
    = DoesNotExist | FailedToGet | FailedToAdd | FailedToRemove;
