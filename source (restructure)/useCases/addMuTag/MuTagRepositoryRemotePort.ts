import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";

export default interface MuTagRepositoryRemotePort {
    //getAll(accountUID: string): Promise<Set<ProvisionedMuTag>>;
    add(muTag: ProvisionedMuTag, accountUid: string): Promise<void>;
    update(muTag: ProvisionedMuTag, accountUid: string): Promise<void>;
    /*updateMultiple(
        muTags: Set<ProvisionedMuTag>,
        accountUID: string
    ): Promise<void>;*/
    //removeByUID(uid: string, accountUID: string): Promise<void>;
    createNewUid(accountUid: string): string;
}
