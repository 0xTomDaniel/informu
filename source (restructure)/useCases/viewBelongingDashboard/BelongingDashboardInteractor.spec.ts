import ProvisionedMuTag, {
    BeaconId,
    MuTagData,
    Address
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";
import {
    BelongingDashboardInteractorImpl,
    DashboardBelonging,
    DashboardBelongingDelta
} from "./BelongingDashboardInteractor";
import MuTagRepositoryLocal from "../../../source/Core/Ports/MuTagRepositoryLocal";
import Account, {
    AccountNumber,
    AccountData
} from "../../../source/Core/Domain/Account";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { take, takeUntil } from "rxjs/operators";
import ObjectCollectionUpdate, {
    ObjectCollectionChange,
    ObjectCollectionAddition
} from "../../shared/metaLanguage/ObjectCollectionUpdate";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import { Subject } from "rxjs";
import { v4 as uuidV4 } from "uuid";

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

const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocal, any>(
    (): MuTagRepositoryLocal => ({
        getByUid: jest.fn(),
        getByBeaconId: jest.fn(),
        getAll: jest.fn(),
        add: jest.fn(),
        addMultiple: jest.fn(),
        update: jest.fn(),
        removeByUid: jest.fn()
    })
);
const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
const AccountRepoLocalMock = jest.fn<AccountRepositoryLocal, any>(
    (): AccountRepositoryLocal => ({
        get: jest.fn(),
        add: jest.fn(),
        update: jest.fn(),
        remove: jest.fn()
    })
);
const accountRepoLocalMock = new AccountRepoLocalMock();
const belongingDashboardInteractor = new BelongingDashboardInteractorImpl(
    muTagRepoLocalMock,
    accountRepoLocalMock
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
        _recentLatitude: 0,
        _recentLongitude: 0,
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
        _recentLatitude: 0,
        _recentLongitude: 0,
        _txPower: 1,
        _uid: uuidV4()
    },
    {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(80),
        _beaconId: BeaconId.create("2"),
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
    }
];
const muTags = [
    new ProvisionedMuTag(belongingsData[0]),
    new ProvisionedMuTag(belongingsData[1]),
    new ProvisionedMuTag(belongingsData[2])
];
const validAccountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _name: "Joe Brown",
    _nextBeaconId: BeaconId.create("0"),
    _nextSafeZoneNumber: 1,
    _onboarding: false,
    _recycledBeaconIds: new Set(),
    _nextMuTagNumber: 10,
    _muTags: new Set()
};
const account = new Account(validAccountData);
(accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);
const notifier = new Subject<void>();

describe("MuTag user views a dashboard of all their belongings", (): void => {
    describe("current account has no belongings", (): void => {
        // Given that an account is logged in

        // Given account contains no belongings
        //
        (muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValueOnce(
            new Set()
        );

        // When the dashboard is opened

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show indication that no Mu tags are attached to account and one needs to be added", async (): Promise<
            void
        > => {
            expect.assertions(1);
            await new Promise((resolve, reject) => {
                belongingDashboardInteractor.showOnDashboard
                    .pipe(take(1))
                    .subscribe(
                        belongings => expect(belongings.initial).toEqual([]),
                        reject,
                        resolve
                    );
            });
        });
    });

    describe("dashboard shows current account belongings and details", (): void => {
        // Given that an account is logged in

        // Given account contains one or more belongings
        //
        const belongingsDashboardData: DashboardBelonging[] = [
            {
                address: undefined,
                batteryLevel: belongingsData[0]._batteryLevel,
                uid: belongingsData[0]._uid,
                name: belongingsData[0]._name,
                isSafe: belongingsData[0]._isSafe,
                lastSeen: belongingsData[0]._lastSeen
            },
            {
                address: undefined,
                batteryLevel: belongingsData[1]._batteryLevel,
                uid: belongingsData[1]._uid,
                name: belongingsData[1]._name,
                isSafe: belongingsData[1]._isSafe,
                lastSeen: belongingsData[1]._lastSeen
            }
        ];
        const belongingsDashboardChange: ObjectCollectionChange<
            DashboardBelongingDelta
        >[] = [
            {
                index: 0,
                elementChange: {
                    uid: belongingsData[0]._uid,
                    address: `${belongingsData[0]._recentAddress?.route}, ${belongingsData[0]._recentAddress?.locality}, ${belongingsData[0]._recentAddress?.administrativeAreaLevel1}`
                }
            },
            {
                index: 1,
                elementChange: {
                    uid: belongingsData[1]._uid,
                    address: `${belongingsData[1]._recentAddress?.route}, ${belongingsData[1]._recentAddress?.locality}, ${belongingsData[1]._recentAddress?.administrativeAreaLevel1}`
                }
            }
        ];
        const currentMuTags = new Set(muTags.slice(0, 2));
        (muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValueOnce(
            currentMuTags
        );

        // When the dashboard is opened
        //
        beforeAll(
            async (): Promise<void> => {
                // This forces all pending promises to complete. I need the
                // 'stop' function to complete before starting this test.
                await new Promise(setImmediate);

                const beaconId01 = account.newBeaconId;
                account.addNewMuTag(muTags[0].uid, beaconId01);
                const beaconId02 = account.newBeaconId;
                account.addNewMuTag(muTags[1].uid, beaconId02);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show a list of all belongings with current icon, name, and status details", async (): Promise<
            void
        > => {
            expect.assertions(3);
            await new Promise((resolve, reject) => {
                let count = 0;
                belongingDashboardInteractor.showOnDashboard
                    .pipe(takeUntil(notifier))
                    .subscribe(belongings => {
                        count += 1;
                        switch (count) {
                            case 1:
                                expect(belongings.initial).toEqual(
                                    belongingsDashboardData
                                );
                                break;
                            case 2:
                                expect(belongings.changed).toEqual([
                                    belongingsDashboardChange[0]
                                ]);
                                break;
                            case 3:
                                expect(belongings.changed).toEqual([
                                    belongingsDashboardChange[1]
                                ]);
                                resolve();
                                break;
                        }
                    }, reject);
            });
        });
    });

    const newBelongingDashboardData: DashboardBelonging = {
        address: undefined,
        batteryLevel: new Percent(80),
        uid: belongingsData[2]._uid,
        name: belongingsData[2]._name,
        isSafe: belongingsData[2]._isSafe,
        lastSeen: belongingsData[2]._lastSeen
    };
    const belongingDashboardAdded: ObjectCollectionAddition<
        DashboardBelonging
    >[] = [
        {
            index: 2,
            element: newBelongingDashboardData
        }
    ];
    const newMuTag = new ProvisionedMuTag(belongingsData[2]);
    let newBeaconId: BeaconId;
    describe("belonging is added to account", (): void => {
        // Given that a new belonging needs to be added to account
        //
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(
            newMuTag
        );

        // When the belonging is added to account

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update list of belongings to show newly added belonging", async (): Promise<
            void
        > => {
            expect.assertions(1);
            await new Promise((resolve, reject) => {
                belongingDashboardInteractor.showOnDashboard
                    .pipe(take(1))
                    .subscribe(
                        belongings => {
                            expect(belongings.added).toEqual(
                                belongingDashboardAdded
                            );
                        },
                        reject,
                        resolve
                    );
                newBeaconId = account.newBeaconId;
                account.addNewMuTag(belongingsData[2]._uid, newBeaconId);
            });
        });
    });

    describe("belonging status details change", (): void => {
        // Given that a belonging is attached to logged in account

        /*const belongingsDashboardData: DashboardBelonging[] = [
            {
                batteryLevel: belongingsData[0]._batteryLevel,
                uid: belongingsData[0]._uid,
                name: belongingsData[0]._name,
                isSafe: belongingsData[0]._isSafe,
                lastSeen: belongingsData[0]._lastSeen
            },
            {
                batteryLevel: belongingsData[1]._batteryLevel,
                uid: belongingsData[1]._uid,
                name: belongingsData[1]._name,
                isSafe: belongingsData[1]._isSafe,
                lastSeen: belongingsData[1]._lastSeen
            },
            newBelongingDashboardData
        ];*/
        const addressUpdates: Address[] = [
            {
                formattedAddress: "Arvada, CO 80003, USA",
                route: "",
                locality: "Arvada",
                administrativeAreaLevel1: "CO"
            },
            {
                formattedAddress: "CO 80005, USA",
                route: "",
                locality: "",
                administrativeAreaLevel1: "CO"
            },
            {
                formattedAddress: "9350 Quitman St, Westminster, CO 80031, USA",
                route: "Quitman St",
                locality: "Westminster",
                administrativeAreaLevel1: "CO"
            }
        ];
        const locationUpdate: [number, number] = [39.8666811, -105.0415883];
        const now = new Date();
        const belongingsDashboardChange: ObjectCollectionChange<
            DashboardBelongingDelta
        >[] = [
            {
                index: 0,
                elementChange: {
                    uid: belongingsData[0]._uid,
                    address: `${belongingsData[0]._recentAddress?.locality}, ${belongingsData[0]._recentAddress?.administrativeAreaLevel1}`
                }
            },
            {
                index: 1,
                elementChange: {
                    uid: belongingsData[1]._uid,
                    isSafe: true,
                    lastSeen: belongingsData[1]._lastSeen
                }
            },
            {
                index: 1,
                elementChange: {
                    uid: belongingsData[1]._uid,
                    isSafe: true,
                    lastSeen: now
                }
            },
            {
                index: 1,
                elementChange: {
                    uid: belongingsData[1]._uid,
                    address: `${belongingsData[1]._recentAddress?.administrativeAreaLevel1}`
                }
            },
            {
                index: 2,
                elementChange: {
                    uid: belongingsData[2]._uid,
                    isSafe: true,
                    lastSeen: belongingsData[2]._lastSeen
                }
            },
            {
                index: 2,
                elementChange: {
                    uid: belongingsData[2]._uid,
                    isSafe: true,
                    lastSeen: now
                }
            },
            {
                index: 2,
                elementChange: {
                    uid: belongingsData[2]._uid,
                    address: `${addressUpdates[2].route}, ${addressUpdates[2].locality}, ${addressUpdates[2].administrativeAreaLevel1}`
                }
            }
        ];

        // When the belonging status changes

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging status in list of belongings", async (): Promise<
            void
        > => {
            expect.assertions(7);
            let count = 0;
            const next = (
                belongings: ObjectCollectionUpdate<
                    DashboardBelonging,
                    DashboardBelongingDelta
                >
            ): void => {
                count += 1;
                expect(belongings.changed).toEqual([
                    belongingsDashboardChange[count - 1]
                ]);
            };
            await new Promise((resolve, reject) => {
                belongingDashboardInteractor.showOnDashboard
                    .pipe(take(7))
                    .subscribe(
                        next,
                        e => reject(e),
                        () => resolve()
                    );
                muTags[0].updateAddress(addressUpdates[0]);
                muTags[1].userDidDetect(now);
                muTags[1].updateAddress(addressUpdates[1]);
                newMuTag.userDidDetect(now);
                newMuTag.updateLocation(...locationUpdate);
                newMuTag.updateAddress(addressUpdates[2]);
            });
        });
    });

    describe("belonging is removed from account", (): void => {
        // Given that a belonging needs to be removed from account

        // Given account contains one or more belongings

        // When the belonging is removed from account

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update list of belongings to no longer show removed belonging", async (): Promise<
            void
        > => {
            expect.assertions(1);
            await new Promise((resolve, reject) => {
                belongingDashboardInteractor.showOnDashboard
                    .pipe(take(1))
                    .subscribe(
                        belongings => {
                            expect(belongings.removed).toEqual([
                                {
                                    index: 2
                                }
                            ]);
                        },
                        e => reject(e),
                        () => resolve()
                    );
                notifier.next();
                account.removeMuTag(belongingsData[2]._uid, newBeaconId);
            });
        });
    });
});
