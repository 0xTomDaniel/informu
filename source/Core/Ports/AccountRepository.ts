import { Account } from '../Domain/Account';

export interface AccountRepository {

    getByUID(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
}
