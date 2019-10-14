export class FailedToErase extends Error {
    constructor() {
        super('Failed to erase local persistence.');
        this.name = 'FailedToErase';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface RepositoryLocal {

    erase(): Promise<void>;
}
