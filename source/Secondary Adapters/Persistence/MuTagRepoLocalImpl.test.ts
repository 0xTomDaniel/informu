import ProvisionedMuTag, { BeaconID } from '../../Core/Domain/ProvisionedMuTag';
import Percent from '../../Core/Domain/Percent';
import MuTagRepoLocalImpl from './MuTagRepoLocalImpl';
import { DoesNotExist } from '../../Core/Ports/MuTagRepositoryLocal';
import { MuTagColor } from '../../Core/Domain/MuTag';
//import { Database } from '@nozbe/watermelondb';
//import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import AccountRepoLocalImpl from './AccountRepoLocalImpl';
import Account, { AccountNumber } from '../../Core/Domain/Account';
import DatabaseImplWatermelon from './DatabaseImplWatermelon';
import { Database } from '@nozbe/watermelondb';

jest.mock('./DatabaseImplWatermelon');
jest.mock('@nozbe/watermelondb');

const WatermelonDBMock = Database as jest.Mock<Database, any>;
const DatabaseImplWatermelonMock = DatabaseImplWatermelon as jest.Mock<DatabaseImplWatermelon, any>;
const watermelonDBMock = new WatermelonDBMock();
const database = new DatabaseImplWatermelonMock(watermelonDBMock);
const accountRepoLocalImpl = new AccountRepoLocalImpl(database);
const account = new Account({
    _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
    _accountNumber: AccountNumber.create('0000000'),
    _emailAddress: 'support+test@informu.io',
    _nextBeaconID: BeaconID.create('B'),
    _recycledBeaconIDs: new Set([BeaconID.create('2'), BeaconID.create('D')]),
    _nextMuTagNumber: 4,
    _muTags: new Set(['randomUUID07', 'randomUUID08']),
});
const existingMuTag07 = new ProvisionedMuTag({
    _uid: 'randomUUID07',
    _beaconID: BeaconID.create('7'),
    _muTagNumber: 7,
    _name: 'wallet',
    _batteryLevel: new Percent(31),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.Kickstarter,
});
const existingMuTag08 = new ProvisionedMuTag({
    _uid: 'randomUUID08',
    _beaconID: BeaconID.create('8'),
    _muTagNumber: 8,
    _name: 'bag',
    _batteryLevel: new Percent(53),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.Cloud,
});
const accountJSON = account.serialize();
const existingMuTag07JSON = existingMuTag07.serialize();
const existingMuTag08JSON = existingMuTag08.serialize();
(database.get as jest.Mock).mockResolvedValueOnce(accountJSON);
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag07JSON);
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag08JSON);
const muTagRepoLocalImpl = new MuTagRepoLocalImpl(database, accountRepoLocalImpl);
const muTagUID = 'randomUUID01';
const muTagBeaconID = BeaconID.create('A');
const muTag = new ProvisionedMuTag({
    _uid: muTagUID,
    _beaconID: muTagBeaconID,
    _muTagNumber: 12,
    _name: 'keys',
    _batteryLevel: new Percent(30),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange,
});

test('successfully adds Mu tag', async (): Promise<void> => {
    (database.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.add(muTag)).resolves.toEqual(undefined);
});

test('successfully gets added Mu tag', async (): Promise<void> => {
    const muTagJSON = muTag.serialize();
    (database.get as jest.Mock).mockResolvedValueOnce(muTagJSON);
    expect.assertions(2);
    await expect(muTagRepoLocalImpl.getByUID(muTagUID)).resolves.toEqual(muTag);
    await expect(muTagRepoLocalImpl.getByBeaconID(muTagBeaconID)).resolves.toEqual(muTag);
});

test('successfully removes Mu tag', async (): Promise<void> => {
    (database.remove as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.removeByUID(muTagUID)).resolves.toEqual(undefined);
});

test('failed to get Mu tag that does not exist', async (): Promise<void> => {
    (database.get as jest.Mock).mockResolvedValueOnce(null);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.getByUID(muTagUID)).rejects.toEqual(new DoesNotExist(muTagUID));
});
