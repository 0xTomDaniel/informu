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
import Logger from "../../shared/metaLanguage/Logger";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import LocationMonitor, {
    GeoLocation,
    GeoLocationEvent
} from "./infrastructure/LocationMonitor";
import { EventSubscription } from "@mauron85/react-native-background-geolocation";

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
const GeoLocationMock = jest.fn<GeoLocation, any>(
    (): GeoLocation => ({
        configure: jest.fn(),
        on: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
    })
);
const geoLocationMock = new GeoLocationMock();
class SubscriptionImpl implements EventSubscription {
    private static readonly subscriptions = new Map<
        string,
        EventSubscription
    >();
    private callback?: (param: any) => void;
    private readonly uid = uuidV4();

    constructor(callback: (param: any) => void) {
        this.callback = callback;
    }

    triggerEvent(param: any): void {
        this.callback?.(param);
    }

    remove(): void {
        this.callback = undefined;
        SubscriptionImpl.subscriptions.delete(this.uid);
    }
}
let locationEventSubscription: SubscriptionImpl;
(geoLocationMock.on as jest.Mock).mockImplementation((event, callback) => {
    switch (event) {
        case GeoLocationEvent.Authorization:
            break;
        case GeoLocationEvent.Error:
            break;
        case GeoLocationEvent.Location: {
            locationEventSubscription = new SubscriptionImpl(callback);
            return locationEventSubscription;
        }
    }
});
const locationMonitor = new LocationMonitor(geoLocationMock);
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
    locationMonitor,
    muTagRepoLocal
);
const firstLocationUpdate = {
    address: "9350 Quitman St., Westminster, CO 80031",
    latitude: 39.8666811,
    longitude: -105.0415883,
    time: new Date().valueOf()
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
                locationEventSubscription.triggerEvent(firstLocationUpdate);
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
            longitude: -104.92854109499716,
            time: new Date().valueOf()
        };

        beforeAll(
            async (): Promise<void> => {
                // Given that belonging is out of range
                //
                belonging.userDidExitRegion();

                // Given that Belongings Location Interactor has started

                // When user location changes
                //
                locationEventSubscription.triggerEvent(secondLocationUpdate);
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
        longitude: -105.09686516468388,
        time: new Date().valueOf()
    };

    describe("Scenario 3: Belonging comes into range", (): void => {
        beforeAll(
            async (): Promise<void> => {
                await new Promise<void>(resolve => {
                    locationMonitor.location.subscribe(() => resolve());
                    locationEventSubscription.triggerEvent(locationUpdateThree);
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

        afterAll(
            async (): Promise<void> => {
                jest.clearAllMocks();
                await belongingsLocationInteractor.stop();
                locationEventSubscription.remove();
            }
        );

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
                longitude: -105.06733748256252,
                time: new Date().valueOf()
            };
            locationEventSubscription.triggerEvent(locationUpdateFour);
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
                longitude: -105.01215995877548,
                time: new Date().valueOf()
            };
            locationMonitor.location.subscribe(() =>
                expect(newBelonging.address).toBe(locationUpdateFive.address)
            );
            locationEventSubscription.triggerEvent(locationUpdateFive);
        });
    });
});
