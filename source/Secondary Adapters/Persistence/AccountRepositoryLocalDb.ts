import { AccountRepositoryLocal, FailedToAdd, FailedToGet, DoesNotExist, FailedToRemove } from '../../Core/Ports/AccountRepositoryLocal';
import { Account } from '../../Core/Domain/Account';
import { serialize, deserialize, ClassTransformOptions } from 'class-transformer';
import { LocalDatabase } from './LocalDatabase';

export class AccountRepositoryLocalDb implements AccountRepositoryLocal {

    private readonly database: LocalDatabase;

    constructor(database: LocalDatabase) {
        this.database = database;
    }

    async get(): Promise<Account> {
        let rawAccount: string | null;

        try {
            rawAccount = await this.database.read('account');
        } catch (error) {
            console.log(error);
            throw new FailedToGet();
        }

        if (typeof rawAccount !== 'string') {
            throw new DoesNotExist();
        }

        return deserialize(Account, rawAccount);
    }

    async add(account: Account): Promise<void> {
        const rawAccount = serialize(account);

        try {
            await this.database.create('account', rawAccount);
        } catch (error) {
            console.log(error);
            throw new FailedToAdd();
        }
    }

    async remove(): Promise<void> {
        try {
            await this.database.delete('account');
        } catch (error) {
            console.log(error);
            throw new FailedToRemove();
        }
    }
}
