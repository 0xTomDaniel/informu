import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryLocalPort {
    getByUid(uid: string): Promise<ProvisionedMuTag>;
    removeByUid(uid: string): Promise<void>;
}
