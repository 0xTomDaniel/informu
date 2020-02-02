import Account from "../../../source/Core/Domain/Account";

export default interface AccountRepositoryRemotePort {
    //getByUID(uid: string): Promise<Account>;
    //add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    //removeByUID(uid: string): Promise<void>;
}
