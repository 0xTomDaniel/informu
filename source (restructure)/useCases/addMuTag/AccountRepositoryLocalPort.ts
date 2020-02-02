import Account from "../../../source/Core/Domain/Account";

export default interface AccountRepositoryLocalPort {
    get(): Promise<Account>;
    //add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    //remove(): Promise<void>;
}
