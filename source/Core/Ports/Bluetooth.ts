import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { RSSI } from '../Domain/Types';

export class ConnectToMuTagFailed extends Error {

    constructor() {
        super('Failed to connect to Mu tag. Please move it closer to the app.');
        this.name = 'ConnectToMuTagFailed';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface Bluetooth {

    connectToNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    provisionMuTag(muTag: UnprovisionedMuTag, name: string): Promise<ProvisionedMuTag>;
}
