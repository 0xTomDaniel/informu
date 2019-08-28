import ProvisionedMuTag from '../Domain/ProvisionedMuTag';

export interface MuTagRepositoryRemote {

    add(muTag: ProvisionedMuTag): Promise<void>;
}
