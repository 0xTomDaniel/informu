import ProvisionedMuTag, {
    MuTagData,
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { v4 as uuidV4 } from "uuid";
import {
    BelongingMapInteractorImpl,
    BelongingLocation,
    BelongingLocationDelta
} from "./BelongingMapInteractor";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import Logger from "../../shared/metaLanguage/Logger";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import { Subscription } from "rxjs";

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

const AccountRepositoryLocalMock = jest.fn<AccountRepositoryLocalPort, any>(
    (): AccountRepositoryLocalPort => ({
        get: jest.fn()
    })
);
const accountRepoLocalMock = new AccountRepositoryLocalMock();
const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        getAll: jest.fn(),
        getByUid: jest.fn()
    })
);
const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
const belongingMapInteractor = new BelongingMapInteractorImpl(
    accountRepoLocalMock,
    muTagRepoLocalMock
);
const dateNow = new Date();
const belongingsData: MuTagData[] = [
    {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(50),
        _beaconId: BeaconId.create("0"),
        _color: MuTagColor.MuOrange,
        _dateAdded: dateNow,
        _didExitRegion: false,
        _firmwareVersion: "1.6.1",
        _isSafe: true,
        _lastSeen: dateNow,
        _macAddress: "BBCCDDEF8734",
        _modelNumber: "REV8",
        _muTagNumber: 0,
        _name: "Keys",
        _recentAddress: {
            formattedAddress: "6229 Lamar St, Arvada, CO 80003, USA",
            route: "Lamar St",
            locality: "Arvada",
            administrativeAreaLevel1: "CO"
        },
        _recentLatitude: 39.80963962521709,
        _recentLongitude: -105.06733748256252,
        _txPower: 1,
        _uid: uuidV4()
    },
    {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(50),
        _beaconId: BeaconId.create("1"),
        _color: MuTagColor.MuOrange,
        _dateAdded: new Date("1995-12-17T03:24:00"),
        _didExitRegion: true,
        _firmwareVersion: "1.6.1",
        _isSafe: false,
        _lastSeen: new Date("1995-12-17T03:24:00"),
        _macAddress: "BBCCDD238734",
        _modelNumber: "REV8",
        _muTagNumber: 1,
        _name: "Laptop",
        _recentAddress: {
            formattedAddress: "7722 Everett St, Arvada, CO 80005, USA",
            route: "Everett St",
            locality: "Arvada",
            administrativeAreaLevel1: "CO"
        },
        _recentLatitude: 39.836557861962184,
        _recentLongitude: -105.09686516468388,
        _txPower: 1,
        _uid: uuidV4()
    }
];
const belongings = new Set([
    new ProvisionedMuTag(belongingsData[0]),
    new ProvisionedMuTag(belongingsData[1])
]);
(muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValue(belongings);
const validAccountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Joe Brown",
    _nextBeaconId: BeaconId.create("2"),
    _nextSafeZoneNumber: 0,
    _onboarding: false,
    _recycledBeaconIds: new Set(),
    _nextMuTagNumber: 2,
    _muTags: new Set(belongingsData.map(belonging => belonging._uid))
};
const account = new Account({
    _uid: validAccountData._uid,
    _accountNumber: validAccountData._accountNumber,
    _emailAddress: validAccountData._emailAddress,
    _name: validAccountData._name,
    _nextBeaconId: validAccountData._nextBeaconId,
    _nextSafeZoneNumber: validAccountData._nextSafeZoneNumber,
    _onboarding: validAccountData._onboarding,
    _recycledBeaconIds: validAccountData._recycledBeaconIds,
    _nextMuTagNumber: validAccountData._nextMuTagNumber,
    _muTags: validAccountData._muTags
});
(accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);

describe("View belongings location on map", (): void => {
    describe("Scenario 1: Belongings have recent location", (): void => {
        // Given that belongings have a recent location

        let showBelongingLocations: BelongingLocation[] | undefined;
        let subscription: Subscription;

        // When the map is opened
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    subscription = belongingMapInteractor.showOnMap.subscribe(
                        update => {
                            showBelongingLocations = update.initial;
                            resolve();
                        },
                        e => Logger.instance.error(e),
                        () => Logger.instance.log("showOnMap completed.")
                    );
                });
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show all belonging's location on the map", (): void => {
            expect(showBelongingLocations).toEqual([
                {
                    name: belongingsData[0]._name,
                    latitude: belongingsData[0]._recentLatitude,
                    longitude: belongingsData[0]._recentLongitude
                },
                {
                    name: belongingsData[1]._name,
                    latitude: belongingsData[1]._recentLatitude,
                    longitude: belongingsData[1]._recentLongitude
                }
            ]);
        });
    });

    const locationChange = {
        latitude: 39.836557861962184,
        longitude: -105.09686516468388
    };

    describe("Scenario 2: Belonging's recent location changes", (): void => {
        let belongingLocationInitial: BelongingLocation[] | undefined;
        let belongingLocationChange: BelongingLocationDelta[] | undefined;
        let subscription: Subscription;

        // When the belonging's recent location changes
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    subscription = belongingMapInteractor.showOnMap.subscribe(
                        update => {
                            if (update.initial != null) {
                                belongingLocationInitial = update.initial;
                                // https://github.com/microsoft/TypeScript/issues/33353
                                const result = belongings.values().next();
                                if (!result.done) {
                                    result.value.updateLocation(
                                        locationChange.latitude,
                                        locationChange.longitude
                                    );
                                }
                            }
                            if (update.changed != null) {
                                belongingLocationChange = update.changed.map(
                                    location => location.elementChange
                                );
                                resolve();
                            }
                        },
                        e => Logger.instance.error(e),
                        () => Logger.instance.log("showOnMap completed.")
                    );
                });
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show belonging's new location on the map", (): void => {
            expect(belongingLocationInitial).toEqual([
                {
                    name: belongingsData[0]._name,
                    latitude: belongingsData[0]._recentLatitude,
                    longitude: belongingsData[0]._recentLongitude
                },
                {
                    name: belongingsData[1]._name,
                    latitude: belongingsData[1]._recentLatitude,
                    longitude: belongingsData[1]._recentLongitude
                }
            ]);
            expect(belongingLocationChange?.[0]).toEqual({
                latitude: locationChange.latitude,
                longitude: locationChange.longitude
            });
        });
    });

    const newBelongingData = {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(80),
        _beaconId: account.newBeaconId,
        _color: MuTagColor.MuOrange,
        _dateAdded: dateNow,
        _didExitRegion: true,
        _firmwareVersion: "1.6.1",
        _isSafe: false,
        _lastSeen: dateNow,
        _macAddress: "A1CCDDEF8734",
        _modelNumber: "REV8",
        _muTagNumber: 3,
        _name: "Wallet",
        _recentLatitude: 0,
        _recentLongitude: 0,
        _txPower: 1,
        _uid: uuidV4()
    };
    const newBelonging = new ProvisionedMuTag(newBelongingData);

    describe("Scenario 3: Belonging is added", (): void => {
        let belongingLocationInitial: BelongingLocation[] | undefined;
        let newBelongingLocation: BelongingLocation[] | undefined;
        let subscription: Subscription;

        // When a belonging is added to account
        //
        beforeAll(
            async (): Promise<void> => {
                (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(
                    newBelonging
                );
                await new Promise(resolve => {
                    subscription = belongingMapInteractor.showOnMap.subscribe(
                        update => {
                            if (update.initial != null) {
                                belongingLocationInitial = update.initial;
                                account.addNewMuTag(
                                    newBelongingData._uid,
                                    newBelongingData._beaconId
                                );
                            }
                            if (update.added != null) {
                                newBelongingLocation = update.added?.map(
                                    location => location.element
                                );
                                resolve();
                            }
                        },
                        e => Logger.instance.error(e),
                        () => Logger.instance.log("showOnMap completed.")
                    );
                });
                belongings.add(newBelonging);
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show belonging's location on the map", (): void => {
            expect(belongingLocationInitial).toEqual([
                {
                    name: belongingsData[0]._name,
                    latitude: locationChange.latitude,
                    longitude: locationChange.longitude
                },
                {
                    name: belongingsData[1]._name,
                    latitude: belongingsData[1]._recentLatitude,
                    longitude: belongingsData[1]._recentLongitude
                }
            ]);
            expect(newBelongingLocation).toEqual([
                {
                    name: newBelongingData._name,
                    latitude: newBelongingData._recentLatitude,
                    longitude: newBelongingData._recentLongitude
                }
            ]);
        });
    });

    describe("Scenario 4: Belonging is removed", (): void => {
        let belongingLocationInitial: BelongingLocation[] | undefined;
        let removedBelonging: number[] | undefined;
        let subscription: Subscription;

        // When a belonging is removed from account
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    subscription = belongingMapInteractor.showOnMap.subscribe(
                        update => {
                            if (update.initial != null) {
                                belongingLocationInitial = update.initial;
                                account.removeMuTag(
                                    newBelongingData._uid,
                                    newBelongingData._beaconId
                                );
                            }
                            if (update.removed != null) {
                                removedBelonging = update.removed?.map(
                                    location => location.index
                                );
                                resolve();
                            }
                        },
                        e => Logger.instance.error(e),
                        () => Logger.instance.log("showOnMap completed.")
                    );
                });
                belongings.delete(newBelonging);
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should remove belonging from map", (): void => {
            expect(belongingLocationInitial).toEqual([
                {
                    name: belongingsData[0]._name,
                    latitude: locationChange.latitude,
                    longitude: locationChange.longitude
                },
                {
                    name: belongingsData[1]._name,
                    latitude: belongingsData[1]._recentLatitude,
                    longitude: belongingsData[1]._recentLongitude
                },
                {
                    name: newBelongingData._name,
                    latitude: newBelongingData._recentLatitude,
                    longitude: newBelongingData._recentLongitude
                }
            ]);
            expect(removedBelonging).toEqual([2]);
        });
    });
});
