import { Account } from '../Domain/Account';

export interface AccountRepositoryRemote {

    getByUID(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
}
