import { AccountRepoRNCAsyncStorage } from './AccountRepoRNCAsyncStorage';
import { Account } from '../../Core/Domain/Account';
import { DoesNotExist } from '../../Core/Ports/AccountRepositoryRemote';

// TODO: Currently unable to use AsyncStorage mock functions directly probably
// because 'async-storage-mock' does not have TypeScript typings.

const accountRepoRNCAsyncStorage = new AccountRepoRNCAsyncStorage();
const account = new Account('AZeloSR9jCOUxOWnf5RYN14r2632', 'support+test@informu.io');

test('successfully adds account', async (): Promise<void> => {
    expect.assertions(1);
    await expect(accountRepoRNCAsyncStorage.add(account)).resolves.toEqual(undefined);
});

test('successfully gets added account', async (): Promise<void> => {
    expect.assertions(1);
    await expect(accountRepoRNCAsyncStorage.get()).resolves.toEqual(account);
});

test('successfully removes account', async (): Promise<void> => {
    expect.assertions(1);
    await expect(accountRepoRNCAsyncStorage.remove()).resolves.toEqual(undefined);
});

test('failed to get account that does not exist', async (): Promise<void> => {
    expect.assertions(1);
    await expect(accountRepoRNCAsyncStorage.get()).rejects.toEqual(new DoesNotExist());
});
