import ProvisionedMuTag, {
    MuTagData,
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import { v4 as uuidV4 } from "uuid";
import { take } from "rxjs/operators";
import MuTagBatteriesInteractor from "./MuTagBatteriesInteractor";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import BackgroundTaskPort from "./BackgroundTaskPort";
import MuTagDevicesPort from "./MuTagDevicesPort";
import { Millisecond } from "../../shared/metaLanguage/Types";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import { Observable, Subscriber } from "rxjs";

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
(accountRepositoryLocalMock.get as jest.Mock).mockResolvedValue(account);
const BackgroundTaskMock = jest.fn<BackgroundTaskPort, any>(
    (): BackgroundTaskPort => ({
        queueRepeatedTask: (
            minimumInterval: Millisecond,
            task: () => void
        ): string => {
            const taskUid = uuidV4();
            setInterval(task, minimumInterval);
            return taskUid;
        }
    })
);
const backgroundTaskMock = new BackgroundTaskMock();
let connectToProvisionedMuTagSubscriber: Subscriber<void>;
const connectToProvisionedMuTagObservable = new Observable<void>(subscriber => {
    connectToProvisionedMuTagSubscriber = subscriber;
    subscriber.next();
});
const MuTagDevicesMock = jest.fn<MuTagDevicesPort, any>(
    (): MuTagDevicesPort => ({
        connectToProvisionedMuTag: (): Observable<void> =>
            connectToProvisionedMuTagObservable,
        disconnectFromProvisionedMuTag: (): void =>
            connectToProvisionedMuTagSubscriber.complete(),
        readBatteryLevel: jest.fn()
    })
);
const muTagDevicesMock = new MuTagDevicesMock();
const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
    (): MuTagRepositoryLocalPort => ({
        getAll: jest.fn(),
        update: jest.fn()
    })
);
const muTagRepositoryLocalMock = new MuTagRepositoryLocalMock();
const belonging01 = new ProvisionedMuTag(belongingsData[0]);
const belonging02 = new ProvisionedMuTag(belongingsData[1]);
(muTagRepositoryLocalMock.getAll as jest.Mock).mockResolvedValue([
    belonging01,
    belonging02
]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const muTagBatteriesInteractor = new MuTagBatteriesInteractor(
    accountRepositoryLocalMock,
    backgroundTaskMock,
    muTagDevicesMock,
    muTagRepositoryLocalMock
);
const oneSecondInMs = 1000;
const oneMinuteInMs = oneSecondInMs * 60;
const oneHourInMs = oneMinuteInMs * 60;

describe("Mu tag battery levels update", (): void => {
    //const belonging02BatteryLevelUpdate01 = new Percent(39);
    //const belonging02BatteryLevelUpdate02 = new Percent(38);

    describe("Scenario 1: Mu tag is in range", (): void => {
        // Given that Mu tag is in range

        const belonging01BatteryLevelUpdate01 = new Percent(49);
        //const belonging01BatteryLevelUpdate02 = new Percent(48);
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(
            belonging01BatteryLevelUpdate01
        );

        // When the battery level hasn't been read for 12 hours
        //
        beforeAll(
            async (): Promise<void> => {
                jest.useFakeTimers("modern");
                await muTagBatteriesInteractor.start();
                debugger;
                await new Promise((resolve, reject) => {
                    belonging01.batteryLevel.pipe(take(2)).subscribe(
                        undefined,
                        e => reject(e),
                        () => resolve()
                    );
                    jest.advanceTimersByTime(oneHourInMs * 12);
                });
                debugger;
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should read and update the Mu tag battery level", async (): Promise<
            void
        > => {
            expect.assertions(2);
            await belonging01.batteryLevel
                .pipe(take(1))
                .toPromise()
                .then(level =>
                    expect(level).toEqual(belonging01BatteryLevelUpdate01)
                );
            await belonging02.batteryLevel
                .pipe(take(1))
                .toPromise()
                .then(level =>
                    expect(level).toEqual(belongingsData[1]._batteryLevel)
                );
        });
    });

    /*describe("Scenario 2: Mu tag is out of range", (): void => {
        // Given 

        

        // When 
        //
        beforeAll(
            async (): Promise<void> => {
                
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should", (): void => {

        });
    });*/
});
