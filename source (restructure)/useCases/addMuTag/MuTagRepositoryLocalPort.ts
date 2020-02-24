import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryLocalPort {
    add(muTag: ProvisionedMuTag): Promise<void>;
    update(muTag: ProvisionedMuTag): Promise<void>;
    removeByUid(uid: string): Promise<void>;
}
