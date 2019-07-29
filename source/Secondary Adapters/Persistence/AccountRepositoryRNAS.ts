import { AccountRepository } from '../../Core/Ports/AccountRepository';
import { Account } from '../../Core/Domain/Account';

export class AccountRepositoryRNAS implements AccountRepository {

    async getByUID(uid: string): Promise<Account> {
        throw new Error('Method not implemented.');
    }

    async add(account: Account): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
