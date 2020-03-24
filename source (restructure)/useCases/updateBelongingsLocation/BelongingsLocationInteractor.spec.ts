import ProvisionedMuTag, {
    MuTagData,
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { v4 as uuidV4 } from "uuid";
import Percent from "../../shared/metaLanguage/Percent";
import MuTagRepoLocalImpl from "../../../source/Secondary Adapters/Persistence/MuTagRepoLocalImpl";
import AccountRepoLocalImpl from "../../../source/Secondary Adapters/Persistence/AccountRepoLocalImpl";
import { Database } from "../../../source/Secondary Adapters/Persistence/Database";
import BelongingsLocationInteractor from "./BelongingsLocationInteractor";
import LocationMonitorPort, { Location } from "./LocationMonitorPort";
import { ReplaySubject } from "rxjs";
import Logger from "../../shared/metaLanguage/Logger";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";

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
const belongingUid = uuidV4();
const belongingData: MuTagData = {
    _advertisingInterval: 1,
    _batteryLevel: new Percent(78),
    _beaconId: BeaconId.create("0"),
    _color: MuTagColor.Indiegogo,
    _dateAdded: new Date(),
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: new Date(),
    _macAddress: "78FB6AE89001",
    _modelNumber: "REV8",
    _muTagNumber: 0,
    _name: "Keys",
    _recentLatitude: 0.0,
    _recentLongitude: 0.0,
    _txPower: 1,
    _uid: belongingUid
};
const belonging = new ProvisionedMuTag(belongingData);
const locationSubject = new ReplaySubject<Location>(1);
const LocationMonitorMock = jest.fn<LocationMonitorPort, any>(
    (): LocationMonitorPort => ({
        location: locationSubject.asObservable()
    })
);
const locationMonitorMock = new LocationMonitorMock();
const DatabaseMock = jest.fn<Database, any>(
    (): Database => ({
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        destroy: jest.fn()
    })
);
const databaseMock = new DatabaseMock();
(databaseMock.set as jest.Mock).mockResolvedValueOnce(undefined);
(databaseMock.remove as jest.Mock).mockResolvedValueOnce(undefined);
(databaseMock.destroy as jest.Mock).mockResolvedValueOnce(undefined);
const accountRepoLocal = new AccountRepoLocalImpl(databaseMock);
const accountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Tonya Brown",
    _nextBeaconId: BeaconId.create("A"),
    _nextSafeZoneNumber: 1,
    _recycledBeaconIds: new Set(),
    _nextMuTagNumber: 10,
    _onboarding: false,
    _muTags: new Set([belongingUid])
};
const account = new Account(accountData);
const muTagRepoLocal = new MuTagRepoLocalImpl(databaseMock, accountRepoLocal);
const belongingsLocationInteractor = new BelongingsLocationInteractor(
    accountRepoLocal,
    locationMonitorMock,
    muTagRepoLocal
);
const firstLocationUpdate = {
    address: "9350 Quitman St., Westminster, CO 80031",
    latitude: 39.8666811,
    longitude: -105.0415883
};

describe("Location of belongings continuously updates", (): void => {
    describe("Scenario 1: Belonging is in range", (): void => {
        beforeAll(
            async (): Promise<void> => {
                await accountRepoLocal.add(account);
                await muTagRepoLocal.add(belonging);

                // Given that belonging is in range

                // Given that Belongings Location Interactor has started
                //
                await belongingsLocationInteractor.start();

                // When user location changes
                //
                locationSubject.next(firstLocationUpdate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging location to user's current location", async (): Promise<
            void
        > => {
            expect(belonging.address).toBe(firstLocationUpdate.address);
        });
    });

    describe("Scenario 2: Belonging is out of range", (): void => {
        const secondLocationUpdate = {
            address: "11894 Elm Drive, Thornton, CO 80233",
            latitude: 39.91177778344706,
            longitude: -104.92854109499716
        };

        beforeAll(
            async (): Promise<void> => {
                // Given that belonging is out of range
                //
                belonging.userDidExitRegion();

                // Given that Belongings Location Interactor has started

                // When user location changes
                //
                locationSubject.next(secondLocationUpdate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should not update belonging location to user's current location", async (): Promise<
            void
        > => {
            expect(belonging.address).toBe(firstLocationUpdate.address);
        });
    });

    const locationUpdateThree = {
        address: "7722 Everett St., Arvada, CO 80005",
        latitude: 39.836557861962184,
        longitude: -105.09686516468388
    };

    describe("Scenario 3: Belonging comes into range", (): void => {
        beforeAll(
            async (): Promise<void> => {
                await new Promise<void>(resolve => {
                    locationMonitorMock.location.subscribe(() => resolve());
                    locationSubject.next(locationUpdateThree);
                });

                // Given that belonging is not in range

                // Given that Belongings Location Interactor has started

                // When belonging comes into range
                //
                belonging.userDidDetect(new Date());
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging location to user's current location", (): void => {
            expect(belonging.address).toBe(locationUpdateThree.address);
        });
    });

    describe("Scenario 4: Belonging is added to account", (): void => {
        const newBelongingBeaconId = account.newBeaconId;
        const newBelongingUid = uuidV4();
        const newBelongingData: MuTagData = {
            _advertisingInterval: 1,
            _batteryLevel: new Percent(78),
            _beaconId: newBelongingBeaconId,
            _color: MuTagColor.Cloud,
            _dateAdded: new Date(),
            _didExitRegion: false,
            _firmwareVersion: "1.6.1",
            _isSafe: true,
            _lastSeen: new Date(),
            _macAddress: "78FB6AE89A01",
            _modelNumber: "REV8",
            _muTagNumber: 0,
            _name: "Wallet",
            _recentLatitude: 0.0,
            _recentLongitude: 0.0,
            _txPower: 1,
            _uid: newBelongingUid
        };
        const newBelonging = new ProvisionedMuTag(newBelongingData);

        beforeAll(
            async (): Promise<void> => {
                await muTagRepoLocal.add(newBelonging);

                // Given that belonging is not on account

                // Given that belongings Location Interactor has started

                // When belonging is added to account
                //
                account.addNewMuTag(
                    newBelongingData._uid,
                    newBelongingData._beaconId
                );
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging location to user's current location", (): void => {
            expect(newBelonging.address).toBe(locationUpdateThree.address);
        });

        // When belonging goes out of range and comes back in range
        //
        // Then
        //
        it("should update belonging location to user's current location a second time", async (): Promise<
            void
        > => {
            newBelonging.userDidExitRegion();
            const locationUpdateFour = {
                address: "6229 Lamar St., Arvada, CO 80003",
                latitude: 39.80963962521709,
                longitude: -105.06733748256252
            };
            locationSubject.next(locationUpdateFour);
            newBelonging.userDidDetect(new Date());
            expect(newBelonging.address).toBe(locationUpdateFour.address);
        });

        // When user location changes
        //
        // Then
        //
        it("should update belonging location to user's current location a third time", async (): Promise<
            void
        > => {
            const locationUpdateFive = {
                address: "6978 Ruth Way, Twin Lakes, CO 80221",
                latitude: 39.82359684169495,
                longitude: -105.01215995877548
            };
            locationMonitorMock.location.subscribe(() =>
                expect(newBelonging.address).toBe(locationUpdateFive.address)
            );
            locationSubject.next(locationUpdateFive);
        });
    });
});
