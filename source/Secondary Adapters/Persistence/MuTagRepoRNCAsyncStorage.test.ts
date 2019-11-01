import ProvisionedMuTag, { BeaconID } from '../../Core/Domain/ProvisionedMuTag';
import Percent from '../../Core/Domain/Percent';
import { MuTagRepoRNCAsyncStorage } from './MuTagRepoRNCAsyncStorage';
import { DoesNotExist } from '../../Core/Ports/MuTagRepositoryLocal';
import { MuTagColor } from '../../Core/Domain/MuTag';

// TODO: Currently unable to use AsyncStorage mock functions directly probably
// because 'async-storage-mock' does not have TypeScript typings.

const muTagRepoRNCAsyncStorage = new MuTagRepoRNCAsyncStorage();
const muTagUID = 'randomUUID';
const muTag = new ProvisionedMuTag({
    _uid: muTagUID,
    _beaconID: BeaconID.create('A'),
    _muTagNumber: 12,
    _name: 'keys',
    _batteryLevel: new Percent(30),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange,
});

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
