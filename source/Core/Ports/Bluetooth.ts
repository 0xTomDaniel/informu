import MuTag from '../Domain/MuTag';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { RSSI } from '../Domain/Types';

export interface Bluetooth {

    findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    connectToMuTag(muTag: MuTag): Promise<void>;
    provisionMuTag(muTag: UnprovisionedMuTag): Promise<ProvisionedMuTag>;
}
