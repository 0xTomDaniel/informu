import Account from "../../../source/Core/Domain/Account";

export default interface AccountRepositoryLocalPort {
    get(): Promise<Account>;
}
