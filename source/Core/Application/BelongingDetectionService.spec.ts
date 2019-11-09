import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { MuTagColor } from '../Domain/MuTag';
import { MuTagSignal, MuTagMonitor, MuTagRegionExit } from '../Ports/MuTagMonitor';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { Observable, Subscriber } from 'rxjs';
import BelongingDetectionService from './BelongingDetectionService';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';

let onMuTagDetectionSubscriber: Subscriber<Set<MuTagSignal>>;
let onMuTagRegionExitSubscriber: Subscriber<Set<MuTagRegionExit>>;
const MuTagMonitorMock  = jest.fn<MuTagMonitor, any>((): MuTagMonitor => ({
    onMuTagDetection: new Observable<Set<MuTagSignal>>((subscriber): void => {
        onMuTagDetectionSubscriber = subscriber;
    }),
    onMuTagRegionExit: new Observable<Set<MuTagRegionExit>>((subscriber): void => {
        onMuTagRegionExitSubscriber = subscriber;
    }),
    startMonitoringMuTags: jest.fn(),
    startRangingAllMuTags: jest.fn(),
}));

const MuTagRepositoryLocalMock
    = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
        getByUID: jest.fn(),
        //getByBeaconID: jest.fn(),
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
const muTagData = {
    _uid: 'UUID01',
    _beaconID: BeaconID.create('0'),
    _muTagNumber: 0,
    _name: 'Wallet',
    _batteryLevel: new Percent(77),
    _isSafe: false,
    _lastSeen: new Date('2019-11-03T17:09:31.007Z'),
    _color: MuTagColor.Charcoal,
};
const muTag = new ProvisionedMuTag(muTagData);
const lastSeenTimestamp = new Date();

describe('last seen status of belongings continuously updates', (): void => {

    describe('app device is in range of a belonging beacon', (): void => {

        // Given that the account connected to the current belonging is logged in
        //
        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(muTag);

        // Given app device is in range of a belonging beacon
        //
        const detectedMuTag: Set<MuTagSignal> = new Set([{
            uid: 'UUID01',
            timestamp: lastSeenTimestamp,
        }]);

        // When the app device detects the belonging beacon
        //
        beforeAll(async (): Promise<void> => {
            belongingDetectionService.start();
            onMuTagDetectionSubscriber.next(detectedMuTag);
            await Promise.resolve();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });


        // Then
        //
        it('should update belonging safety status to true with detected timestamp', (): void => {
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
        const exitedMuTag: Set<MuTagRegionExit> = new Set([{
            uid: 'UUID01',
            timestamp: now,
        }]);

        // When the app device is out of beacon region for 30 seconds
        //
        beforeAll(async (): Promise<void> => {
            onMuTagRegionExitSubscriber.next(exitedMuTag);
            await Promise.resolve();
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
