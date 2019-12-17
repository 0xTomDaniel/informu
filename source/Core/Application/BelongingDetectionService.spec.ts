import ProvisionedMuTag, { BeaconID } from "../Domain/ProvisionedMuTag";
import Percent from "../Domain/Percent";
import { MuTagColor } from "../Domain/MuTag";
import {
    MuTagSignal,
    MuTagMonitor,
    MuTagRegionExit,
    MuTagBeacon
} from "../Ports/MuTagMonitor";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { Observable, Subscriber } from "rxjs";
import BelongingDetectionService from "./BelongingDetectionService";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import Account, { AccountNumber, AccountData } from "../Domain/Account";

let onMuTagDetectionSubscriber: Subscriber<Set<MuTagSignal>>;
let onMuTagRegionExitSubscriber: Subscriber<MuTagRegionExit>;
const MuTagMonitorMock = jest.fn<MuTagMonitor, any>(
    (): MuTagMonitor => ({
        onMuTagDetection: new Observable<Set<MuTagSignal>>(
            (subscriber): void => {
                onMuTagDetectionSubscriber = subscriber;
            }
        ),
        onMuTagRegionExit: new Observable<MuTagRegionExit>(
            (subscriber): void => {
                onMuTagRegionExitSubscriber = subscriber;
            }
        ),
        startMonitoringMuTags: jest.fn(),
        stopMonitoringMuTags: jest.fn(),
        startRangingAllMuTags: jest.fn(),
        stopAllMonitoringAndRanging: jest.fn()
    })
);

const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocal, any>(
    (): MuTagRepositoryLocal => ({
        getByUID: jest.fn(),
        getByBeaconID: jest.fn(),
        getAll: jest.fn(),
        add: jest.fn(),
        addMultiple: jest.fn(),
        update: jest.fn(),
        removeByUID: jest.fn()
    })
);

const AccountRepositoryLocalMock = jest.fn<AccountRepositoryLocal, any>(
    (): AccountRepositoryLocal => ({
        get: jest.fn(),
        add: jest.fn(),
        update: jest.fn(),
        remove: jest.fn()
    })
);

const muTagMonitorMock = new MuTagMonitorMock();
const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
const accountRepoLocalMock = new AccountRepositoryLocalMock();

const belongingDetectionService = new BelongingDetectionService(
    muTagMonitorMock,
    muTagRepoLocalMock,
    accountRepoLocalMock
);

const nonAccountNumber = AccountNumber.fromString("0000002");
const accountNumber = AccountNumber.fromString("0000001");
const accountData: AccountData = {
    _uid: "UUID01",
    _accountNumber: accountNumber,
    _emailAddress: "user@email.com",
    _nextBeaconID: BeaconID.create("2"),
    _recycledBeaconIDs: new Set(),
    _nextMuTagNumber: 2,
    _muTags: new Set()
};
const account = new Account(accountData);
const muTagBeaconID = BeaconID.create("0");
const muTagData = {
    _uid: "UUID01",
    _beaconID: muTagBeaconID,
    _muTagNumber: 0,
    _name: "Wallet",
    _batteryLevel: new Percent(77),
    _isSafe: false,
    _lastSeen: new Date("2019-11-03T17:09:31.007Z"),
    _color: MuTagColor.Charcoal
};
const muTag = new ProvisionedMuTag(muTagData);
const muTagBeacon: MuTagBeacon = {
    uid: muTagData._uid,
    accountNumber: accountNumber,
    beaconID: muTagBeaconID
};
const addedBeaconID = account.newBeaconID;
const addedMuTagNumber = account.newMuTagNumber;
const addedMuTagData = {
    _uid: "UUID02",
    _beaconID: addedBeaconID,
    _muTagNumber: addedMuTagNumber,
    _name: "Bag",
    _batteryLevel: new Percent(68),
    _isSafe: false,
    _lastSeen: new Date("2019-11-02T17:09:31.007Z"),
    _color: MuTagColor.Charcoal
};
const addedMuTag = new ProvisionedMuTag(addedMuTagData);
const lastSeenTimestamp = new Date();

describe("last seen status of belongings continuously updates", (): void => {
    describe("app device is in range of a belonging beacon", (): void => {
        // Given that the account connected to the current belonging is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);
        (muTagRepoLocalMock.getAll as jest.Mock).mockResolvedValueOnce(
            new Set([muTag])
        );
        (muTagRepoLocalMock.getByBeaconID as jest.Mock).mockResolvedValueOnce(
            muTag
        );

        // Given app device is in range of a belonging beacon
        //
        const detectedMuTags: Set<MuTagSignal> = new Set([
            {
                accountNumber: accountNumber,
                beaconID: muTagBeaconID,
                timestamp: lastSeenTimestamp
            },
            {
                accountNumber: nonAccountNumber,
                beaconID: muTagBeaconID,
                timestamp: lastSeenTimestamp
            }
        ]);

        // When the app device detects the belonging beacon
        //
        beforeAll(
            async (): Promise<void> => {
                await belongingDetectionService.start();
                onMuTagDetectionSubscriber.next(detectedMuTags);

                // https://stackoverflow.com/questions/44741102/how-to-make-jest-wait-for-all-asynchronous-code-to-finish-execution-before-expec
                await new Promise(setImmediate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging safety status to true with detected timestamp", (): void => {
            expect(
                muTagMonitorMock.startMonitoringMuTags
            ).toHaveBeenCalledTimes(1);
            expect(muTagMonitorMock.startMonitoringMuTags).toHaveBeenCalledWith(
                new Set([muTagBeacon])
            );
            expect(
                muTagMonitorMock.startRangingAllMuTags
            ).toHaveBeenCalledTimes(1);
            expect(muTag.isSafe).toEqual(true);
            expect(muTag.lastSeen).toEqual(lastSeenTimestamp);
        });

        // Then
        //
        it("should update belonging in local repo", (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
        });
    });

    describe("app device has exited belonging beacon region outside of assigned Safe Zone", (): void => {
        // Given that the account connected to the current belonging is logged in
        //
        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(muTag);

        // Given app device has exited belonging beacon region outside of Safe Zone
        //
        const now = new Date();
        const exitedMuTag: MuTagRegionExit = {
            uid: "UUID01",
            timestamp: now
        };

        // When the app device is out of beacon region for 30 seconds
        //
        beforeAll(
            async (): Promise<void> => {
                onMuTagRegionExitSubscriber.next(exitedMuTag);
                await new Promise(setImmediate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should update belonging safe status to false", (): void => {
            expect(muTag.isSafe).toEqual(false);
            expect(muTag.lastSeen).toEqual(lastSeenTimestamp);
        });

        // Then
        //
        it("should update belonging in local repo", (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
        });
    });

    describe("belonging is added to account", (): void => {
        // Given that an account is logged in

        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(
            addedMuTag
        );
        (muTagRepoLocalMock.getByBeaconID as jest.Mock).mockResolvedValueOnce(
            addedMuTag
        );

        const detectedTimestamp = new Date();
        const detectedMuTags: Set<MuTagSignal> = new Set([
            {
                accountNumber: accountNumber,
                beaconID: addedMuTagData._beaconID,
                timestamp: detectedTimestamp
            }
        ]);

        // When a belonging is added to account
        //
        beforeAll(
            async (): Promise<void> => {
                account.addNewMuTag(
                    addedMuTagData._uid,
                    addedMuTagData._beaconID
                );
                await new Promise(setImmediate);
                onMuTagDetectionSubscriber.next(detectedMuTags);
                await new Promise(setImmediate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should start updating belonging safety status", (): void => {
            expect(addedMuTag.lastSeen).toEqual(detectedTimestamp);
        });
    });

    describe("belonging is removed from account", (): void => {
        // Given that an account is logged in

        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(
            addedMuTag
        );
        const addedMuTagBeacon: MuTagBeacon = {
            uid: addedMuTagData._uid,
            accountNumber: accountNumber,
            beaconID: addedBeaconID
        };

        // When a belonging is removed from account
        //
        beforeAll(
            async (): Promise<void> => {
                account.removeMuTag(
                    addedMuTagData._uid,
                    addedMuTagData._beaconID
                );
                await new Promise(setImmediate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should stop updating belonging safety status", (): void => {
            expect(muTagMonitorMock.stopMonitoringMuTags).toHaveBeenCalledTimes(
                1
            );
            expect(muTagMonitorMock.stopMonitoringMuTags).toHaveBeenCalledWith(
                new Set([addedMuTagBeacon])
            );
        });
    });

    describe("user logs out", (): void => {
        // Given that an account is logged in

        // When user logs out
        //
        beforeAll(
            async (): Promise<void> => {
                await belongingDetectionService.stop();
                await new Promise(setImmediate);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should stop updating all belongings", (): void => {
            expect(
                muTagMonitorMock.stopAllMonitoringAndRanging
            ).toHaveBeenCalledTimes(1);
        });
    });
});
