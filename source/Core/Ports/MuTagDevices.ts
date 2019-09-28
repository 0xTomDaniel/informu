import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { RSSI } from '../Domain/Types';
import { BeaconID } from '../Domain/ProvisionedMuTag';
import { AccountNumber } from '../Domain/Account';

export class ConnectToMuTagFailed extends Error {

    constructor() {
        super('Failed to connect to Mu tag. Please move it closer to the app.');
        this.name = 'ConnectToMuTagFailed';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface MuTagDevices {

    findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    cancelFindNewMuTag(): Promise<void>;
    provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: AccountNumber,
        beaconID: BeaconID,
        muTagName: string,
    ): Promise<ProvisionedMuTag>;
}
