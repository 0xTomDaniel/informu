import ProvisionedMuTag, { BeaconId } from '../Domain/ProvisionedMuTag';

export class DoesNotExist extends Error {
    constructor(id: string) {
        super(`Mu tag (${id}) entity does not exist in local persistence.`);
        this.name = 'DoesNotExist';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGet extends Error {
    constructor() {
        super('Failed to get Mu tag entity from local persistence.');
        this.name = 'FailedToGet';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class PersistedDataMalformed extends Error {
    constructor(json: string) {
        super(`Received malformed data from local persistence:\n${json}`);
        this.name = 'PersistedDataMalformed';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToAdd extends Error {
    constructor() {
        super('Failed to add Mu tag entity to local persistence.');
        this.name = 'FailedToAdd';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToUpdate extends Error {
    constructor() {
        super('Failed to update Mu tag entity to local persistence.');
        this.name = 'FailedToUpdate';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToRemove extends Error {
    constructor() {
        super('Failed to remove Mu tag entity from local persistence.');
        this.name = 'FailedToRemove';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface MuTagRepositoryLocal {

    getByUID(uid: string): Promise<ProvisionedMuTag>;
    getByBeaconID(beaconID: BeaconId): Promise<ProvisionedMuTag>;
    getAll(): Promise<Set<ProvisionedMuTag>>;
    add(muTag: ProvisionedMuTag): Promise<void>;
    addMultiple(muTags: Set<ProvisionedMuTag>): Promise<void>;
    update(muTag: ProvisionedMuTag): Promise<void>;
    removeByUID(uid: string): Promise<void>;
}
