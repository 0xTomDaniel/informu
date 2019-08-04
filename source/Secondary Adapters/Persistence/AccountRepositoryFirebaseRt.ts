import { AccountRepositoryRemote } from '../../Core/Ports/AccountRepositoryRemote';
import { Account } from '../../Core/Domain/Account';

export class AccountRepositoryFirebaseRt implements AccountRepositoryRemote {

    async getByUID(uid: string): Promise<Account> {
        throw new Error('Method not implemented.');
    }

    async add(account: Account): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
