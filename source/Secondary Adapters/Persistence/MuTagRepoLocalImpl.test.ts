import ProvisionedMuTag, { BeaconID } from "../../Core/Domain/ProvisionedMuTag";
import Percent from "../../Core/Domain/Percent";
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
const existingMuTag07 = new ProvisionedMuTag({
    _uid: "randomUUID07",
    _beaconID: BeaconID.create("7"),
    _muTagNumber: 7,
    _name: "wallet",
    _batteryLevel: new Percent(31),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.Kickstarter
});
const existingMuTag08 = new ProvisionedMuTag({
    _uid: "randomUUID08",
    _beaconID: BeaconID.create("8"),
    _muTagNumber: 8,
    _name: "bag",
    _batteryLevel: new Percent(53),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.Cloud
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
const muTag01BeaconID = BeaconID.create("A");
const muTag01 = new ProvisionedMuTag({
    _uid: muTag01UID,
    _beaconID: muTag01BeaconID,
    _muTagNumber: 12,
    _name: "keys",
    _batteryLevel: new Percent(30),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange
});
const muTag02UID = "randomUUID02";
const muTag02BeaconID = BeaconID.create("B");
const muTag02 = new ProvisionedMuTag({
    _uid: muTag02UID,
    _beaconID: muTag02BeaconID,
    _muTagNumber: 13,
    _name: "laptop",
    _batteryLevel: new Percent(30),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange
});
const muTag03UID = "randomUUID03";
const muTag03BeaconID = BeaconID.create("C");
const muTag03 = new ProvisionedMuTag({
    _uid: muTag03UID,
    _beaconID: muTag03BeaconID,
    _muTagNumber: 14,
    _name: "bag",
    _batteryLevel: new Percent(30),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange
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
    await expect(muTagRepoLocalImpl.getByUID(muTag01UID)).resolves.toEqual(
        muTag01
    );
    await expect(
        muTagRepoLocalImpl.getByBeaconID(muTag01BeaconID)
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
    await expect(muTagRepoLocalImpl.removeByUID(muTag01UID)).resolves.toEqual(
        undefined
    );
});

test("failed to get Mu tag that does not exist", async (): Promise<void> => {
    (database.get as jest.Mock).mockResolvedValueOnce(null);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.getByUID(muTag01UID)).rejects.toEqual(
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
        _nextBeaconID: BeaconID.create("B"),
        _recycledBeaconIDs: new Set([
            BeaconID.create("2"),
            BeaconID.create("D")
        ]),
        _nextMuTagNumber: 4,
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
