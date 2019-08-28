import ProvisionedMuTag from '../Domain/ProvisionedMuTag';

export interface MuTagRepositoryLocal {

    add(muTag: ProvisionedMuTag): Promise<void>;
}
