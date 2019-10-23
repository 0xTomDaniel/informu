import ProvisionedMuTag, { BeaconID } from '../../Core/Domain/ProvisionedMuTag';
import Percent from '../../Core/Domain/Percent';
import { MuTagRepoRNCAsyncStorage } from './MuTagRepoRNCAsyncStorage';
import { DoesNotExist } from '../../Core/Ports/MuTagRepositoryLocal';

// TODO: Currently unable to use AsyncStorage mock functions directly probably
// because 'async-storage-mock' does not have TypeScript typings.

const muTagRepoRNCAsyncStorage = new MuTagRepoRNCAsyncStorage();
const muTagUID = 'randomUUID';
const muTag = new ProvisionedMuTag(
    muTagUID,
    BeaconID.create('A'),
    12,
    'keys',
    new Percent(30),
    true,
    new Date(),
);

test('successfully adds Mu tag', async (): Promise<void> => {
    expect.assertions(1);
    await expect(muTagRepoRNCAsyncStorage.add(muTag)).resolves.toEqual(undefined);
});

test('successfully gets added Mu tag', async (): Promise<void> => {
    expect.assertions(1);
    await expect(muTagRepoRNCAsyncStorage.getByUID(muTagUID)).resolves.toEqual(muTag);
});

test('successfully removes Mu tag', async (): Promise<void> => {
    expect.assertions(1);
    await expect(muTagRepoRNCAsyncStorage.removeByUID(muTagUID)).resolves.toEqual(undefined);
});

test('failed to get Mu tag that does not exist', async (): Promise<void> => {
    expect.assertions(1);
    await expect(muTagRepoRNCAsyncStorage.getByUID(muTagUID)).rejects.toEqual(new DoesNotExist());
});
