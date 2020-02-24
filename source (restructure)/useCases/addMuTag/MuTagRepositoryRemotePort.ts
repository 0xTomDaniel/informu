import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import { AccountNumber } from "../../../source/Core/Domain/Account";

export default interface MuTagRepositoryRemotePort {
    add(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    update(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    removeByUid(uid: string, accountUid: string): Promise<void>;
    createNewUid(accountUid: string): string;
}
