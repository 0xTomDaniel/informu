import ProvisionedMuTag, {
    BeaconId,
    MuTagData
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";
import {
    BelongingDashboardOutputPort,
    DashboardBelonging,
    DashboardBelongingUpdate
} from "./BelongingDashboardOutputPort";
import BelongingDashboardInteractor from "./BelongingDashboardInteractor";
import { MuTagRepositoryLocal } from "../../../source/Core/Ports/MuTagRepositoryLocal";
import Account, {
    AccountNumber,
    AccountData
} from "../../../source/Core/Domain/Account";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { take } from "rxjs/operators";

describe("Mu tag user views a dashboard of all their belongings", (): void => {
    const BelongingDashboardOutputMock = jest.fn<
        BelongingDashboardOutputPort,
        any
    >(
        (): BelongingDashboardOutputPort => ({
            showAll: jest.fn(),
            showNone: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        })
    );
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
    const AccountRepoLocalMock = jest.fn<AccountRepositoryLocal, any>(
        (): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        })
    );

    const belongingDashboardOutputMock = new BelongingDashboardOutputMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const belongingDashboardInteractor = new BelongingDashboardInteractor(
        belongingDashboardOutputMock,
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
            _uid: "randomUUID01"
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
            _uid: "randomUUID02"
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
            _uid: "randomUUID03"
        }
    ];
    const muTags = new Set([
        new ProvisionedMuTag(belongingsData[0]),
        new ProvisionedMuTag(belongingsData[1])
    ]);
    const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
    const accountMuTags = [belongingsData[0]._uid, belongingsData[1]._uid];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _name: "Joe Brown",
        _nextBeaconId: BeaconId.create("A"),
        _nextSafeZoneNumber: 1,
        _onboarding: false,
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _nextMuTagNumber: 10,
        _muTags: new Set(accountMuTags)
    };
    const account = new Account(validAccountData);
    const accountNoMuTags = new Account({
        _uid: validAccountData._uid,
        _accountNumber: validAccountData._accountNumber,
        _emailAddress: validAccountData._emailAddress,
        _name: validAccountData._name,
        _nextBeaconId: validAccountData._nextBeaconId,
        _nextSafeZoneNumber: validAccountData._nextSafeZoneNumber,
        _onboarding: validAccountData._onboarding,
        _recycledBeaconIds: validAccountData._recycledBeaconIds,
        _nextMuTagNumber: validAccountData._nextMuTagNumber,
        _muTags: new Set()
    });
    const addedBeaconId = accountNoMuTags.newBeaconId;
    const newBelongingDashboardData: DashboardBelonging = {
        uid: belongingsData[2]._uid,
        name: belongingsData[2]._name,
        isSafe: belongingsData[2]._isSafe,
        lastSeen: belongingsData[2]._lastSeen
    };
    const newMuTag = new ProvisionedMuTag(belongingsData[2]);

    describe("dashboard shows current account belongings and details", (): void => {
        // Given that an account is logged in

        // Given account contains one or more belongings
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        const belongingsDashboardData: DashboardBelonging[] = [
            {
                uid: belongingsData[0]._uid,
                name: belongingsData[0]._name,
                isSafe: belongingsData[0]._isSafe,
                lastSeen: belongingsData[0]._lastSeen
            },
            {
                uid: belongingsData[1]._uid,
                name: belongingsData[1]._name,
                isSafe: belongingsData[1]._isSafe,
                lastSeen: belongingsData[1]._lastSeen
            }
        ];
        const belongingsDashboardUpdate: DashboardBelongingUpdate[] = [
            {
                uid: belongingsData[0]._uid,
                address: `${belongingsData[0]._recentAddress?.route}, ${belongingsData[0]._recentAddress?.locality}, ${belongingsData[0]._recentAddress?.administrativeAreaLevel1}`
            },
            {
                uid: belongingsData[1]._uid,
                address: `${belongingsData[1]._recentAddress?.route}, ${belongingsData[1]._recentAddress?.locality}, ${belongingsData[1]._recentAddress?.administrativeAreaLevel1}`
            }
        ];
        (muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValueOnce(muTags);

        // When the dashboard is opened
        //
        beforeAll(
            async (): Promise<void> => {
                await belongingDashboardInteractor.open();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show a list of all belongings with current icon, name, and status details", (): void => {
            expect(belongingDashboardOutputMock.showAll).toHaveBeenCalledTimes(
                1
            );
            expect(belongingDashboardOutputMock.showAll).toHaveBeenCalledWith(
                belongingsDashboardData
            );
            expect(belongingDashboardOutputMock.update).toHaveBeenCalledTimes(
                2
            );
            expect(belongingDashboardOutputMock.update).toHaveBeenNthCalledWith(
                1,
                belongingsDashboardUpdate[0]
            );
            expect(
                belongingDashboardOutputMock.update
            ).toHaveBeenLastCalledWith(belongingsDashboardUpdate[1]);
        });
    });

    describe("current account has no belongings", (): void => {
        // Given that an account is logged in

        // Given account contains no belongings
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(
            accountNoMuTags
        );
        const noMuTags: Set<ProvisionedMuTag> = new Set();
        (muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValueOnce(
            noMuTags
        );

        // When the dashboard is opened
        //
        beforeAll(
            async (): Promise<void> => {
                await belongingDashboardInteractor.open();
            }
        );

        // Then
        //
        it("should show indication that no Mu tags are attached to account and one needs to be added", (): void => {
            expect(belongingDashboardOutputMock.showNone).toHaveBeenCalledTimes(
                1
            );
        });
    });

    describe("belonging is added to account", (): void => {
        // Given that a new belonging needs to be added to account
        //
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(
            newMuTag
        );

        // When the belonging is added to account
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    accountNoMuTags.muTagsChange
                        .pipe(take(1))
                        .subscribe(undefined, undefined, () => resolve());
                    accountNoMuTags.addNewMuTag(
                        belongingsData[2]._uid,
                        addedBeaconId
                    );
                });
            }
        );

        // Then
        //
        it("should update list of belongings to show newly added belonging", async (): Promise<
            void
        > => {
            expect(belongingDashboardOutputMock.add).toHaveBeenCalledTimes(1);
            expect(belongingDashboardOutputMock.add).toHaveBeenCalledWith(
                newBelongingDashboardData
            );
        });
    });

    describe("belonging status details change", (): void => {
        // Given that a belonging is attached to logged in account

        // When the belonging status changes
        //
        const now = new Date();
        //
        beforeAll((): void => {
            newMuTag.userDidDetect(now);
            newMuTag.updateLocation(39.8666811, -105.0415883);
            newMuTag.updateAddress({
                formattedAddress: "9350 Quitman St, Westminster, CO 80031, USA",
                route: "Quitman St",
                locality: "Westminster",
                administrativeAreaLevel1: "CO"
            });
        });

        // Then
        //
        it("should update belonging status in list of belongings", async (): Promise<
            void
        > => {
            expect(belongingDashboardOutputMock.update).toHaveBeenNthCalledWith(
                3,
                {
                    uid: belongingsData[2]._uid,
                    isSafe: true,
                    lastSeen: now
                }
            );
            expect(
                belongingDashboardOutputMock.update
            ).toHaveBeenLastCalledWith({
                uid: belongingsData[2]._uid,
                address: "Quitman St, Westminster, CO"
            });
        });
    });

    describe("belonging is removed from account", (): void => {
        // Given that a belonging needs to be removed from account
        //
        const belongingUID = "randomUUID03";

        // Given account contains one or more belongings

        // When the belonging is removed from account
        //
        beforeAll((): void => {
            accountNoMuTags.removeMuTag(belongingUID, addedBeaconId);
        });

        // Then
        //
        it("should update list of belongings to no longer show removed belonging", async (): Promise<
            void
        > => {
            expect(belongingDashboardOutputMock.remove).toHaveBeenCalledTimes(
                1
            );
            expect(belongingDashboardOutputMock.remove).toHaveBeenCalledWith(
                belongingUID
            );
        });
    });
});
