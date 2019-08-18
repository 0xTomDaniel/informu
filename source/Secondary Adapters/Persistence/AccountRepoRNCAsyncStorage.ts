import { AccountRepositoryLocal, FailedToAdd, FailedToGet, DoesNotExist, FailedToRemove } from '../../Core/Ports/AccountRepositoryLocal';
import { Account } from '../../Core/Domain/Account';
import { serialize, deserialize } from 'class-transformer';
import AsyncStorage from '@react-native-community/async-storage';

export class AccountRepoRNCAsyncStorage implements AccountRepositoryLocal {

    async get(): Promise<Account> {
        let rawAccount: string | null;

        try {
            rawAccount = await AsyncStorage.getItem('account');
        } catch (e) {
            console.log(e);
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
            await AsyncStorage.setItem('account', rawAccount);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async remove(): Promise<void> {
        try {
            await AsyncStorage.removeItem('account');
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }
}
