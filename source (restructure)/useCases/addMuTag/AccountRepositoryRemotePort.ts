import Account from "../../../source/Core/Domain/Account";

export default interface AccountRepositoryRemotePort {
    update(account: Account): Promise<void>;
}
