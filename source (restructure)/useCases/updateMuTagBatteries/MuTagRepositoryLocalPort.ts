import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryLocalPort {
    getAll(): Promise<Set<ProvisionedMuTag>>;
    update(muTag: ProvisionedMuTag): Promise<void>;
}
