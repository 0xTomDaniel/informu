import { AccountRepoRNCAsyncStorage } from './AccountRepoRNCAsyncStorage';
import Account, { AccountNumber } from '../../Core/Domain/Account';
import { DoesNotExist } from '../../Core/Ports/AccountRepositoryLocal';
import { BeaconID } from '../../Core/Domain/ProvisionedMuTag';

// TODO: Currently unable to use AsyncStorage mock functions directly probably
// because 'async-storage-mock' does not have TypeScript typings.

const accountRepoRNCAsyncStorage = new AccountRepoRNCAsyncStorage();
const account = new Account({
    _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
    _accountNumber: AccountNumber.create('0000000'),
    _emailAddress: 'support+test@informu.io',
    _nextBeaconID: BeaconID.create('B'),
    _recycledBeaconIDs: new Set([BeaconID.create('2'), BeaconID.create('D')]),
    _nextMuTagNumber: 4,
    _muTags: new Set(['randomUUID']),
});

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
