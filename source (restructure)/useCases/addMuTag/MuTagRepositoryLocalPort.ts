import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryLocalPort {
    //getByUID(uid: string): Promise<ProvisionedMuTag>;
    //getByBeaconID(beaconID: BeaconId): Promise<ProvisionedMuTag>;
    //getAll(): Promise<Set<ProvisionedMuTag>>;
    add(muTag: ProvisionedMuTag): Promise<void>;
    //addMultiple(muTags: Set<ProvisionedMuTag>): Promise<void>;
    update(muTag: ProvisionedMuTag): Promise<void>;
    //removeByUID(uid: string): Promise<void>;
}
