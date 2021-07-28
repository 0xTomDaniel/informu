import ProvisionedMuTag, {
    MuTagData,
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { v4 as uuidV4 } from "uuid";
import { take, skip } from "rxjs/operators";
import { MuTagBatteriesInteractorImpl } from "./MuTagBatteriesInteractor";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import { Observable, Subscriber } from "rxjs";
import { fakeSchedulers } from "rxjs-marbles/jest";
import { BackgroundFetchProxy } from "./device/BackgroundFetchProxy";
import BackgroundTask from "./device/BackgroundTask";
import { BackgroundFetchConfig } from "react-native-background-fetch";
import MuTagDevicesPort, {
    Connection
} from "../../shared/muTagDevices/MuTagDevicesPort";

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
const accountRepositoryLocalMock = new AccountRepositoryLocalMock();
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
        _batteryLevel: new Percent(40),
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
    },
    {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(65),
        _beaconId: BeaconId.create("2"),
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
(accountRepositoryLocalMock.get as jest.Mock).mockReturnValue(
    Promise.resolve(account)
);
let interval: NodeJS.Timeout | undefined;
const BackgroundFetchProxyMock = jest.fn<BackgroundFetchProxy, any>(
    (): BackgroundFetchProxy => ({
        configure: (
            _config: BackgroundFetchConfig,
            callback: (taskId: string) => void
        ) => {
            interval = setInterval(() => callback("taskId"), 1000);
        },
        finish: jest.fn()
    })
);
const backgroundFetchProxyMock = new BackgroundFetchProxyMock();
const backgroundTask = new BackgroundTask(backgroundFetchProxyMock);
let connectToProvisionedMuTagSubscriber: Subscriber<Connection>;
const connectToProvisionedMuTagObservable = new Observable<Connection>(
    subscriber => {
        connectToProvisionedMuTagSubscriber = subscriber;
        subscriber.next();
    }
);

const MuTagDevicesMock = jest.fn<MuTagDevicesPort, any>(
    (): MuTagDevicesPort => ({
        changeAdvertisingInterval: jest.fn(),
        changeTxPower: jest.fn(),
        connectToProvisionedMuTag: (): Observable<Connection> =>
            connectToProvisionedMuTagObservable,
        connectToUnprovisionedMuTag: jest.fn(),
        disconnectFromMuTag: async (): Promise<void> =>
            connectToProvisionedMuTagSubscriber.complete(),
        provisionMuTag: jest.fn(),
        readBatteryLevel: jest.fn(),
        startFindingUnprovisionedMuTags: jest.fn(),
        stopFindingUnprovisionedMuTags: jest.fn(),
        unprovisionMuTag: jest.fn()
    })
);
const muTagDevicesMock = new MuTagDevicesMock();
const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        getAll: jest.fn(),
        getByUid: jest.fn(),
        update: jest.fn()
    })
);
const muTagRepositoryLocalMock = new MuTagRepositoryLocalMock();
const belonging01 = new ProvisionedMuTag(belongingsData[0]);
const belonging02 = new ProvisionedMuTag(belongingsData[1]);
(muTagRepositoryLocalMock.getAll as jest.Mock).mockReturnValue(
    Promise.resolve(new Set([belonging01, belonging02]))
);
const muTagBatteriesInteractor = new MuTagBatteriesInteractorImpl(
    accountRepositoryLocalMock,
    backgroundTask,
    muTagDevicesMock,
    muTagRepositoryLocalMock
);
const oneSecondInMs = 1000;
const oneMinuteInMs = oneSecondInMs * 60;
const oneHourInMs = oneMinuteInMs * 60;

describe("MuTag battery levels update", (): void => {
    describe("Scenario 1: MuTag is in range", (): void => {
        // Given that MuTag is in range

        const batteryLevelUpdate01 = new Percent(49);
        const batteryLevelUpdate02 = new Percent(48);
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(batteryLevelUpdate01)
        );
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(batteryLevelUpdate02)
        );

        // When the battery level hasn't been read for 12 hours
        //
        beforeAll(
            async (): Promise<void> => {
                jest.useFakeTimers("modern");
                await muTagBatteriesInteractor.start();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it(
            "should read and update the MuTag battery level",
            fakeSchedulers(async advance => {
                expect.assertions(3);
                const promise01 = belonging01.batteryLevel
                    .pipe(skip(1), take(1))
                    .toPromise();
                advance(oneHourInMs * 12);
                const batteryLevel01 = await promise01;
                expect(batteryLevel01).toBe(batteryLevelUpdate01);
                const promise02 = belonging01.batteryLevel
                    .pipe(skip(1), take(1))
                    .toPromise();
                advance(oneHourInMs * 12);
                const batteryLevel02 = await promise02;
                expect(batteryLevel02).toBe(batteryLevelUpdate02);
                const batterylevel03 = await belonging02.batteryLevel
                    .pipe(take(1))
                    .toPromise();
                expect(batterylevel03).toEqual(belongingsData[1]._batteryLevel);
            })
        );
    });

    describe("Scenario 2: MuTag is out of range", (): void => {
        // Given that the MuTag is out of range

        const batteryLevelUpdate = new Percent(36);
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(batteryLevelUpdate)
        );

        let promise01: Promise<Percent>;
        // When the battery level hasn't been read for 12 hours
        //
        // And the MuTag comes back into range
        //
        beforeAll(
            async (): Promise<void> => {
                promise01 = belonging02.batteryLevel
                    .pipe(skip(1), take(1))
                    .toPromise();
                belonging02.userDidDetect(new Date());
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it(
            "should read and update the MuTag battery level",
            fakeSchedulers(async () => {
                const batteryLevel = await promise01;
                expect(batteryLevel).toBe(batteryLevelUpdate);
            })
        );
    });

    const newBelongingBeaconId = account.newBeaconId;
    const newBelongingUid = uuidV4();
    const dateAdded = new Date();
    const newBelongingData: MuTagData = {
        _advertisingInterval: 1,
        _batteryLevel: new Percent(65),
        _beaconId: newBelongingBeaconId,
        _color: MuTagColor.Sky,
        _dateAdded: dateAdded,
        _didExitRegion: false,
        _firmwareVersion: "1.6.1",
        _isSafe: true,
        _lastSeen: dateAdded,
        _macAddress: "BBCCDD273734",
        _modelNumber: "REV8",
        _muTagNumber: 2,
        _name: "Bag",
        _recentAddress: {
            formattedAddress: "7722 Everett St, Arvada, CO 80005, USA",
            route: "Everett St",
            locality: "Arvada",
            administrativeAreaLevel1: "CO"
        },
        _recentLatitude: 39.836557861962184,
        _recentLongitude: -105.09686516468388,
        _txPower: 1,
        _uid: newBelongingUid
    };
    const newBelonging = new ProvisionedMuTag(newBelongingData);

    describe("Scenario 3: MuTag is added", (): void => {
        // Given that a MuTag is unprovisioned

        (muTagRepositoryLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(
            newBelonging
        );
        const belonging01BatteryLevel = new Percent(48);
        const belonging02BatteryLevel = new Percent(36);
        const batteryLevelUpdate = new Percent(62);
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(belonging01BatteryLevel)
        );
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(belonging02BatteryLevel)
        );
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(batteryLevelUpdate)
        );

        // When the MuTag is added to the current account
        //
        beforeAll(
            async (): Promise<void> => {
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
        it(
            "should read and update the MuTag battery level every 12 hours",
            fakeSchedulers(async advance => {
                expect.assertions(1);
                const promise = newBelonging.batteryLevel
                    .pipe(skip(1), take(1))
                    .toPromise();
                advance(oneHourInMs * 12);
                const batteryLevel = await promise;
                expect(batteryLevel).toBe(batteryLevelUpdate);
            })
        );
    });

    describe("Scenario 4: MuTag is removed", (): void => {
        // Given that a MuTag is added to the current account

        //const belonging01BatteryLevel = new Percent(43);
        const belonging02BatteryLevel = new Percent(36);
        const batteryLevelUpdate = new Percent(59);
        /*(muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(belonging01BatteryLevel)
        );*/
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(belonging02BatteryLevel)
        );
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockReturnValueOnce(
            Promise.resolve(batteryLevelUpdate)
        );

        // When the MuTag is added to the current account
        //
        beforeAll(
            async (): Promise<void> => {
                account.removeMuTag(belonging01.uid, belonging01.beaconId);
            }
        );

        afterAll((): void => {
            if (interval != null) {
                clearInterval(interval);
            }
            jest.useRealTimers();
            jest.clearAllMocks();
        });

        // Then
        //
        it(
            "should read and update the MuTag battery level every 12 hours",
            fakeSchedulers(async advance => {
                expect.assertions(1);
                const promise = newBelonging.batteryLevel
                    .pipe(skip(1), take(1))
                    .toPromise();
                advance(oneHourInMs * 12);
                const batteryLevel = await promise;
                expect(batteryLevel).toBe(batteryLevelUpdate);
            })
        );
    });
});
