import ProvisionedMuTag, { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import MuTagRepoLocalImpl from "./MuTagRepoLocalImpl";
import { DoesNotExist as MuTagDoesNotExist } from "../../Core/Ports/MuTagRepositoryLocal";
import { MuTagColor } from "../../Core/Domain/MuTag";
import AccountRepoLocalImpl from "./AccountRepoLocalImpl";
import Account, { AccountNumber } from "../../Core/Domain/Account";
import DatabaseImplWatermelon from "./DatabaseImplWatermelon";
import { Database } from "@nozbe/watermelondb";

jest.mock("./DatabaseImplWatermelon");
jest.mock("@nozbe/watermelondb");

const WatermelonDBMock = Database as jest.Mock<Database, any>;
const DatabaseImplWatermelonMock = DatabaseImplWatermelon as jest.Mock<
    DatabaseImplWatermelon,
    any
>;
const watermelonDBMock = new WatermelonDBMock();
const database = new DatabaseImplWatermelonMock(watermelonDBMock);
const accountRepoLocalImpl = new AccountRepoLocalImpl(database);
const dateNow = new Date();
const existingMuTag07 = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: new Percent(31),
    _beaconId: BeaconId.create("7"),
    _color: MuTagColor.Kickstarter,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "8230CBE0DE89",
    _modelNumber: "REV8",
    _muTagNumber: 7,
    _name: "wallet",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: "randomUUID07"
});
const existingMuTag08 = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: new Percent(53),
    _beaconId: BeaconId.create("8"),
    _color: MuTagColor.Cloud,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "8230CBE0D2389",
    _modelNumber: "REV8",
    _muTagNumber: 8,
    _name: "bag",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: "randomUUID08"
});

// If the user is logged out then Account will not exist when the
// MuTagLocalRepository instantiates and attempts to populate the Mu tag cache.
//
(database.get as jest.Mock).mockResolvedValueOnce(null);

const existingMuTag07JSON = existingMuTag07.serialize();
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag07JSON);
const existingMuTag08JSON = existingMuTag08.serialize();
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag08JSON);
const muTagRepoLocalImpl = new MuTagRepoLocalImpl(
    database,
    accountRepoLocalImpl
);
const muTag01UID = "randomUUID01";
const muTag01BeaconId = BeaconId.create("A");
const muTag01 = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: new Percent(30),
    _beaconId: muTag01BeaconId,
    _color: MuTagColor.MuOrange,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "822CBE0DE89",
    _modelNumber: "REV8",
    _muTagNumber: 12,
    _name: "keys",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: muTag01UID
});
const muTag02UID = "randomUUID02";
const muTag02BeaconId = BeaconId.create("B");
const muTag02 = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: new Percent(30),
    _beaconId: muTag02BeaconId,
    _color: MuTagColor.MuOrange,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "8230CBEFBE89",
    _modelNumber: "REV8",
    _muTagNumber: 13,
    _name: "laptop",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: muTag02UID
});
const muTag03UID = "randomUUID03";
const muTag03BeaconId = BeaconId.create("C");
const muTag03 = new ProvisionedMuTag({
    _advertisingInterval: 1,
    _batteryLevel: new Percent(30),
    _beaconId: muTag03BeaconId,
    _color: MuTagColor.MuOrange,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "8000CBE0DE89",
    _modelNumber: "REV8",
    _muTagNumber: 14,
    _name: "bag",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: muTag03UID
});

test("successfully adds Mu tag", async (): Promise<void> => {
    (database.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.add(muTag01)).resolves.toEqual(undefined);
});

test("successfully gets added Mu tag", async (): Promise<void> => {
    const muTagJSON = muTag01.serialize();
    (database.get as jest.Mock).mockResolvedValueOnce(muTagJSON);
    expect.assertions(2);
    await expect(muTagRepoLocalImpl.getByUid(muTag01UID)).resolves.toEqual(
        muTag01
    );
    await expect(
        muTagRepoLocalImpl.getByBeaconId(muTag01BeaconId)
    ).resolves.toEqual(muTag01);
});

test("successfully adds two Mu tags", async (): Promise<void> => {
    (database.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    const muTagsToAdd = new Set([muTag02, muTag03]);
    await expect(muTagRepoLocalImpl.addMultiple(muTagsToAdd)).resolves.toEqual(
        undefined
    );
});

test("successfully removes Mu tag", async (): Promise<void> => {
    (database.remove as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.removeByUid(muTag01UID)).resolves.toEqual(
        undefined
    );
});

test("failed to get Mu tag that does not exist", async (): Promise<void> => {
    (database.get as jest.Mock).mockResolvedValueOnce(null);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.getByUid(muTag01UID)).rejects.toEqual(
        new MuTagDoesNotExist(muTag01UID)
    );
});

test("successfully populate Mu tag cache from logged in account", async (): Promise<
    void
> => {
    const account = new Account({
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _name: "Billy Cruise",
        _nextBeaconId: BeaconId.create("B"),
        _nextSafeZoneNumber: 3,
        _recycledBeaconIds: new Set([
            BeaconId.create("2"),
            BeaconId.create("D")
        ]),
        _nextMuTagNumber: 4,
        _onboarding: false,
        _muTags: new Set(["randomUUID07", "randomUUID08"])
    });
    const accountJSON = account.serialize();
    const newMuTagRepoLocalImpl = new MuTagRepoLocalImpl(
        database,
        accountRepoLocalImpl
    );
    (database.get as jest.Mock).mockResolvedValueOnce(accountJSON);
    expect.assertions(1);
    await expect(newMuTagRepoLocalImpl.getAll()).resolves.toEqual(
        new Set<ProvisionedMuTag>()
    );
});
