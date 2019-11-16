import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { MuTagColor } from '../Domain/MuTag';
import { MuTagSignal, MuTagMonitor, MuTagRegionExit } from '../Ports/MuTagMonitor';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { Observable, Subscriber } from 'rxjs';
import BelongingDetectionService from './BelongingDetectionService';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import Account, { AccountNumber, AccountData } from '../Domain/Account';

let onMuTagDetectionSubscriber: Subscriber<Set<MuTagSignal>>;
let onMuTagRegionExitSubscriber: Subscriber<MuTagRegionExit>;
const MuTagMonitorMock  = jest.fn<MuTagMonitor, any>((): MuTagMonitor => ({
    onMuTagDetection: new Observable<Set<MuTagSignal>>((subscriber): void => {
        onMuTagDetectionSubscriber = subscriber;
    }),
    onMuTagRegionExit: new Observable<MuTagRegionExit>((subscriber): void => {
        onMuTagRegionExitSubscriber = subscriber;
    }),
    startMonitoringMuTags: jest.fn(),
    startRangingAllMuTags: jest.fn(),
}));

const MuTagRepositoryLocalMock
    = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
        getByUID: jest.fn(),
        getByBeaconID: jest.fn(),
        getAll: jest.fn(),
        add: jest.fn(),
        addMultiple: jest.fn(),
        update: jest.fn(),
        removeByUID: jest.fn(),
    }));

const AccountRepositoryLocalMock
    = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
        get: jest.fn(),
        add: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    }));

const muTagMonitorMock = new MuTagMonitorMock();
const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
const accountRepoLocalMock = new AccountRepositoryLocalMock();

const belongingDetectionService = new BelongingDetectionService(
    muTagMonitorMock, muTagRepoLocalMock, accountRepoLocalMock
);

const accountNumber = AccountNumber.create('0000001');
const accountData: AccountData = {
    _uid: 'UUID01',
    _accountNumber: accountNumber,
    _emailAddress: 'user@email.com',
    _nextBeaconID: BeaconID.create('2'),
    _recycledBeaconIDs: new Set(),
    _nextMuTagNumber: 2,
    _muTags: new Set(),
};
const account = new Account(accountData);
const muTagBeaconID = BeaconID.create('0');
const muTagData = {
    _uid: 'UUID01',
    _beaconID: muTagBeaconID,
    _muTagNumber: 0,
    _name: 'Wallet',
    _batteryLevel: new Percent(77),
    _isSafe: false,
    _lastSeen: new Date('2019-11-03T17:09:31.007Z'),
    _color: MuTagColor.Charcoal,
};
const nonAccountNumber = AccountNumber.create('0000002');
/*const nonAccountMuTagData = {
    _uid: 'UUID09',
    _beaconID: muTagBeaconID,
    _muTagNumber: 0,
    _name: 'Wallet',
    _batteryLevel: new Percent(56),
    _isSafe: false,
    _lastSeen: new Date('2019-11-03T17:09:31.007Z'),
    _color: MuTagColor.Cloud,
};*/
const muTag = new ProvisionedMuTag(muTagData);
//const nonAccountMuTag = new ProvisionedMuTag(nonAccountMuTagData);
const lastSeenTimestamp = new Date();

describe('last seen status of belongings continuously updates', (): void => {

    describe('app device is in range of a belonging beacon', (): void => {

        // Given that the account connected to the current belonging is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);
        (muTagRepoLocalMock.getByBeaconID as jest.Mock).mockResolvedValueOnce(muTag);

        // Given app device is in range of a belonging beacon
        //
        const detectedMuTags: Set<MuTagSignal> = new Set([
            {
                accountNumber: accountNumber,
                beaconID: muTagBeaconID,
                timestamp: lastSeenTimestamp,
            },
            {
                accountNumber: nonAccountNumber,
                beaconID: muTagBeaconID,
                timestamp: lastSeenTimestamp,
            },
        ]);

        // When the app device detects the belonging beacon
        //
        beforeAll(async (): Promise<void> => {
            belongingDetectionService.start();
            onMuTagDetectionSubscriber.next(detectedMuTags);

            // https://stackoverflow.com/questions/44741102/how-to-make-jest-wait-for-all-asynchronous-code-to-finish-execution-before-expec
            await new Promise(setImmediate);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });


        // Then
        //
        it('should update belonging safety status to true with detected timestamp', (): void => {
            expect(muTagRepoLocalMock.getByBeaconID).toHaveBeenCalledTimes(1);
            expect(muTag.isSafe).toEqual(true);
            expect(muTag.lastSeen).toEqual(lastSeenTimestamp);
        });

        // Then
        //
        it('should update belonging in local repo', (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
        });
    });

    describe('app device has exited belonging beacon region outside of assigned Safe Zone', (): void => {

        // Given that the account connected to the current belonging is logged in
        //
        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(muTag);

        // Given app device has exited belonging beacon region outside of Safe Zone
        //
        const now = new Date();
        const exitedMuTag: MuTagRegionExit = {
            uid: 'UUID01',
            timestamp: now,
        };

        // When the app device is out of beacon region for 30 seconds
        //
        beforeAll(async (): Promise<void> => {
            onMuTagRegionExitSubscriber.next(exitedMuTag);
            await new Promise(setImmediate);
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });


        // Then
        //
        it('should update belonging safe status to false', (): void => {
            expect(muTag.isSafe).toEqual(false);
            expect(muTag.lastSeen).toEqual(lastSeenTimestamp);
        });

        // Then
        //
        it('should update belonging in local repo', (): void => {
            expect(muTagRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.update).toHaveBeenCalledWith(muTag);
        });
    });
});
