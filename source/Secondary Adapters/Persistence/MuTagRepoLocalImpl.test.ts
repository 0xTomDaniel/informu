import ProvisionedMuTag, { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import MuTagRepoLocalImpl from "./MuTagRepoLocalImpl";
import { MuTagRepositoryLocalException } from "../../Core/Ports/MuTagRepositoryLocal";
import { MuTagColor } from "../../Core/Domain/MuTag";
import AccountRepoLocalImpl from "./AccountRepoLocalImpl";
import Account, { AccountNumber, AccountData } from "../../Core/Domain/Account";
import DatabaseImplWatermelon from "./DatabaseImplWatermelon";
import { Database } from "@nozbe/watermelondb";
import Logger from "../../../source (restructure)/shared/metaLanguage/Logger";
import EventTracker from "../../../source (restructure)/shared/metaLanguage/EventTracker";
import { v4 as uuidV4 } from "uuid";

jest.mock("./DatabaseImplWatermelon");
jest.mock("@nozbe/watermelondb");

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

const WatermelonDBMock = Database as jest.Mock<Database, any>;
const DatabaseImplWatermelonMock = DatabaseImplWatermelon as jest.Mock<
    DatabaseImplWatermelon,
    any
>;
const watermelonDBMock = new WatermelonDBMock();
const databaseMock = new DatabaseImplWatermelonMock(watermelonDBMock);
(databaseMock.set as jest.Mock).mockResolvedValueOnce(undefined);
(databaseMock.remove as jest.Mock).mockResolvedValueOnce(undefined);
(databaseMock.destroy as jest.Mock).mockResolvedValueOnce(undefined);
const accountRepoLocalImpl = new AccountRepoLocalImpl(databaseMock);
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
    _uid: uuidV4()
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
    _macAddress: "8230CBE0D23C6",
    _modelNumber: "REV8",
    _muTagNumber: 8,
    _name: "bag",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: uuidV4()
});

/*(database.get as jest.Mock).mockResolvedValueOnce(null);

const existingMuTag07JSON = existingMuTag07.serialize();
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag07JSON);
const existingMuTag08JSON = existingMuTag08.serialize();
(database.get as jest.Mock).mockResolvedValueOnce(existingMuTag08JSON);*/
let muTagRepoLocalImpl = new MuTagRepoLocalImpl(
    databaseMock,
    accountRepoLocalImpl
);
const accountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Billy Cruise",
    _nextBeaconId: BeaconId.create("A"),
    _nextSafeZoneNumber: 1,
    _recycledBeaconIds: new Set(),
    _nextMuTagNumber: 10,
    _onboarding: false,
    _muTags: new Set([existingMuTag07.uid, existingMuTag08.uid])
};
const account = new Account(accountData);
const muTag01BeaconId = account.newBeaconId;
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
    _uid: uuidV4()
});

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
    _uid: uuidV4()
});

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
    _uid: uuidV4()
});
(databaseMock.get as jest.Mock).mockImplementation(
    key =>
        new Promise(resolve => {
            switch (key) {
                case `muTags/${existingMuTag07.uid}`:
                    resolve(existingMuTag07.serialize());
                    break;
                case `muTags/${existingMuTag08.uid}`:
                    resolve(existingMuTag08.serialize());
                    break;
                default:
                    resolve();
            }
        })
);

test("successfully populate MuTag cache from logged in account", async (): Promise<
    void
> => {
    await accountRepoLocalImpl.add(account);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.getAll()).resolves.toEqual(
        new Set<ProvisionedMuTag>([existingMuTag07, existingMuTag08])
    );
});

test("successfully adds MuTag", async (): Promise<void> => {
    // Create new instance so that cache is no longer populated
    muTagRepoLocalImpl = new MuTagRepoLocalImpl(
        databaseMock,
        accountRepoLocalImpl
    );
    (databaseMock.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    account.addNewMuTag(muTag01.uid, muTag01BeaconId);
    await expect(muTagRepoLocalImpl.add(muTag01)).resolves.toEqual(undefined);
});

test("successfully gets added MuTag instance that's not overwritten by new instance from database", async (): Promise<
    void
> => {
    expect.assertions(2);
    await expect(muTagRepoLocalImpl.getByUid(muTag01.uid)).resolves.toBe(
        muTag01
    );
    await expect(
        muTagRepoLocalImpl.getByBeaconId(muTag01BeaconId)
    ).resolves.toBe(muTag01);
});

test("successfully adds two Mu tags", async (): Promise<void> => {
    (databaseMock.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    const muTagsToAdd = new Set([muTag02, muTag03]);
    await expect(muTagRepoLocalImpl.addMultiple(muTagsToAdd)).resolves.toEqual(
        undefined
    );
});

test("successfully removes MuTag", async (): Promise<void> => {
    (databaseMock.remove as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.removeByUid(muTag01.uid)).resolves.toEqual(
        undefined
    );
});

test("failed to get MuTag that does not exist", async (): Promise<void> => {
    (databaseMock.get as jest.Mock).mockResolvedValueOnce(null);
    expect.assertions(1);
    await expect(muTagRepoLocalImpl.getByUid(muTag01.uid)).rejects.toEqual(
        MuTagRepositoryLocalException.DoesNotExist(muTag01.uid)
    );
});
