import AccountRepoLocalImpl from "./AccountRepoLocalImpl";
import Account, { AccountNumber } from "../../Core/Domain/Account";
import { AccountRepositoryLocalException } from "../../Core/Ports/AccountRepositoryLocal";
import { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import DatabaseImplWatermelon from "./DatabaseImplWatermelon";
import { Database } from "@nozbe/watermelondb";
import EventTracker from "../../../source (restructure)/shared/metaLanguage/EventTracker";
import Logger from "../../../source (restructure)/shared/metaLanguage/Logger";

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
const database = new DatabaseImplWatermelonMock(watermelonDBMock);
(database.get as jest.Mock).mockResolvedValue(null);
let accountRepoLocalImpl = new AccountRepoLocalImpl(database);
const account = new Account({
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Zach Mei",
    _nextBeaconId: BeaconId.create("B"),
    _nextSafeZoneNumber: 8,
    _recycledBeaconIds: new Set([BeaconId.create("2"), BeaconId.create("D")]),
    _nextMuTagNumber: 4,
    _onboarding: false,
    _muTags: new Set(["randomUUID"])
});

test("successfully adds account", async (): Promise<void> => {
    (database.set as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(accountRepoLocalImpl.add(account)).resolves.toEqual(undefined);
});

test("successfully gets added account twice that are the same object instance", async (): Promise<
    void
> => {
    // Reset instance so the cache is not longer populated
    accountRepoLocalImpl = new AccountRepoLocalImpl(database);

    const accountJson = account.serialize();
    (database.get as jest.Mock).mockResolvedValueOnce(accountJson);
    expect.assertions(3);
    let firstAccount: Account;
    let secondAccount: Account;
    await new Promise(resolve => {
        let completionCount = 0;
        accountRepoLocalImpl.get().then(acc => {
            firstAccount = acc;
            completionCount += 1;
            if (completionCount === 2) {
                resolve();
            }
        });
        accountRepoLocalImpl.get().then(acc => {
            secondAccount = acc;
            completionCount += 1;
            if (completionCount === 2) {
                resolve();
            }
        });
    });
    expect(firstAccount!).toEqual(account);
    expect(secondAccount!).toEqual(account);
    expect(secondAccount!).toBe(firstAccount!);
});

test("successfully removes account", async (): Promise<void> => {
    (database.remove as jest.Mock).mockResolvedValueOnce(undefined);
    expect.assertions(1);
    await expect(accountRepoLocalImpl.remove()).resolves.toEqual(undefined);
});

test("failed to get account that does not exist", async (): Promise<void> => {
    //(database.get as jest.Mock).mockResolvedValueOnce(null);
    expect.assertions(1);
    await expect(accountRepoLocalImpl.get()).rejects.toEqual(
        AccountRepositoryLocalException.DoesNotExist
    );
});
