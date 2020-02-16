import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryRemotePort {
    add(muTag: ProvisionedMuTag, accountUid: string): Promise<void>;
    update(muTag: ProvisionedMuTag, accountUid: string): Promise<void>;
    removeByUid(uid: string, accountUid: string): Promise<void>;
    createNewUid(accountUid: string): string;
}
