import {
    AccountRepositoryLocal,
    FailedToAdd,
    FailedToGet,
    DoesNotExist,
    FailedToRemove,
    FailedToUpdate,
} from '../../Core/Ports/AccountRepositoryLocal';
import Account from '../../Core/Domain/Account';
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

        return Account.deserialize(rawAccount);
    }

    async add(account: Account): Promise<void> {
        const rawAccount = account.serialize();

        try {
            await AsyncStorage.setItem('account', rawAccount);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(account: Account): Promise<void> {
        const rawAccount = account.serialize();

        try {
            // Using 'setItem' because documentation of 'mergeItem' is too vague.
            // I don't want to have any unforeseen issues.
            await AsyncStorage.setItem('account', rawAccount);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
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
