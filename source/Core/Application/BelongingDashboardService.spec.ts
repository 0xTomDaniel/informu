import ProvisionedMuTag, { BeaconID, MuTagData } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { BelongingDashboardOutput, DashboardBelonging } from '../Ports/BelongingDashboardOutput';
import BelongingDashboardService from './BelongingDashboardService';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import Account, { AccountNumber } from '../Domain/Account';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { MuTagColor } from '../Domain/MuTag';

describe('Mu tag user views a dashboard of all their belongings', (): void => {

    const BelongingDashboardOutputMock
        = jest.fn<BelongingDashboardOutput, any>((): BelongingDashboardOutput => ({
            showAll: jest.fn(),
            showNone: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        }));
    const MuTagRepositoryLocalMock
        = jest.fn<MuTagRepositoryLocal, any>((): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn(),
        }));
    const AccountRepoLocalMock
        = jest.fn<AccountRepositoryLocal, any>((): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        }));

    const belongingDashboardOutputMock = new BelongingDashboardOutputMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const belongingDashboardService = new BelongingDashboardService(
        belongingDashboardOutputMock,
        muTagRepoLocalMock,
        accountRepoLocalMock,
    );

    const belongingsData: MuTagData[] = [
        {
            _uid: 'randomUUID01',
            _beaconID: BeaconID.create('0'),
            _muTagNumber: 0,
            _name: 'Keys',
            _batteryLevel: new Percent(50),
            _isSafe: true,
            _lastSeen: new Date(),
            _color: MuTagColor.MuOrange,
        },
        {
            _uid: 'randomUUID02',
            _beaconID: BeaconID.create('1'),
            _muTagNumber: 1,
            _name: 'Laptop',
            _batteryLevel: new Percent(50),
            _isSafe: false,
            _lastSeen: new Date('1995-12-17T03:24:00'),
            _color: MuTagColor.MuOrange,
        },
        {
            _uid: 'randomUUID03',
            _beaconID: BeaconID.create('2'),
            _muTagNumber: 3,
            _name: 'Wallet',
            _batteryLevel: new Percent(80),
            _isSafe: false,
            _lastSeen: new Date(),
            _color: MuTagColor.MuOrange,
        },
    ];
    const muTags = new Set([
        new ProvisionedMuTag(belongingsData[0]),
        new ProvisionedMuTag(belongingsData[1]),
    ]);
    const validAccountData = {
        uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
        accountNumber: AccountNumber.create('0000000'),
        emailAddress: 'support+test@informu.io',
        nextBeaconID: BeaconID.create('A'),
        recycledBeaconIDs: [
            BeaconID.create('2'),
            BeaconID.create('5'),
        ],
        nextMuTagNumber: 10,
        muTags: [belongingsData[0]._uid, belongingsData[1]._uid],
    };
    const account = new Account(
        validAccountData.uid,
        validAccountData.accountNumber,
        validAccountData.emailAddress,
        validAccountData.nextBeaconID,
        validAccountData.recycledBeaconIDs,
        validAccountData.nextMuTagNumber,
        validAccountData.muTags,
    );
    const accountNoMuTags = new Account(
        validAccountData.uid,
        validAccountData.accountNumber,
        validAccountData.emailAddress,
        validAccountData.nextBeaconID,
        validAccountData.recycledBeaconIDs,
        validAccountData.nextMuTagNumber,
        [],
    );
    const addedBeaconID = accountNoMuTags.getNewBeaconID();
    const newBelongingDashboardData: DashboardBelonging = {
        uid: belongingsData[2]._uid,
        name: belongingsData[2]._name,
        isSafe: belongingsData[2]._isSafe,
        lastSeen: belongingsData[2]._lastSeen,
    };
    const newMuTag = new ProvisionedMuTag(belongingsData[2]);

    describe('dashboard shows current account belongings and details', (): void => {

        // Given that an account is logged in

        // Given account contains one or more belongings
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        const belongingsDashboardData: DashboardBelonging[] = [
            {
                uid: belongingsData[0]._uid,
                name: belongingsData[0]._name,
                isSafe: belongingsData[0]._isSafe,
                lastSeen: belongingsData[0]._lastSeen,
            },
            {
                uid: belongingsData[1]._uid,
                name: belongingsData[1]._name,
                isSafe: belongingsData[1]._isSafe,
                lastSeen: belongingsData[1]._lastSeen,
            },
        ];
        (muTagRepoLocalMock.getAll as jest.Mock)
            .mockResolvedValueOnce(muTags);

        // When the dashboard is opened
        //
        beforeAll(async (): Promise<void> => {
            await belongingDashboardService.open();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it('should show a list of all belongings with current icon, name, and status details', (): void => {
            expect(belongingDashboardOutputMock.showAll).toHaveBeenCalledTimes(1);
            expect(belongingDashboardOutputMock.showAll).toHaveBeenCalledWith(belongingsDashboardData);
        });
    });

    describe('current account has no belongings', (): void => {

        // Given that an account is logged in

        // Given account contains no belongings
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(accountNoMuTags);
        const noMuTags: Set<ProvisionedMuTag> = new Set();
        (muTagRepoLocalMock.getAll as jest.Mock)
            .mockResolvedValueOnce(noMuTags);

        // When the dashboard is opened
        //
        beforeAll(async (): Promise<void> => {
            await belongingDashboardService.open();
        });

        // Then
        //
        it('should show indication that no Mu tags are attached to account and one needs to be added', (): void => {
            expect(belongingDashboardOutputMock.showNone).toHaveBeenCalledTimes(1);
        });
    });

    describe('belonging is added to account', (): void => {

        // Given that a new belonging needs to be added to account
        //
        (muTagRepoLocalMock.getByUID as jest.Mock).mockResolvedValueOnce(newMuTag);

        // When the belonging is added to account
        //
        beforeAll((): void => {
            accountNoMuTags.addNewMuTag(belongingsData[2]._uid, addedBeaconID);
        });

        // Then
        //
        it('should update list of belongings to show newly added belonging', async (): Promise<void> => {
            expect(belongingDashboardOutputMock.add).toHaveBeenCalledTimes(1);
            expect(belongingDashboardOutputMock.add).toHaveBeenCalledWith(newBelongingDashboardData);
        });
    });

    describe('belonging status details change', (): void => {

        // Given that a belonging is attached to logged in account

        // When the belonging status changes
        //
        const now = new Date();
        //
        beforeAll((): void => {
            newMuTag.userDidDetect(now);
        });

        // Then
        //
        it('should update belonging status in list of belongings', async (): Promise<void> => {
            expect(belongingDashboardOutputMock.update).toHaveBeenLastCalledWith({
                uid: belongingsData[2]._uid,
                isSafe: true,
                lastSeen: now,
            });
        });
    });

    describe('belonging is removed from account', (): void => {

        // Given that a belonging needs to be removed from account
        //
        const belongingUID = 'randomUUID03';

        // Given account contains one or more belongings

        // When the belonging is removed from account
        //
        beforeAll((): void => {
            accountNoMuTags.removeMuTag(belongingUID, addedBeaconID);
        });

        // Then
        //
        it('should update list of belongings to no longer show removed belonging', async (): Promise<void> => {
            expect(belongingDashboardOutputMock.remove).toHaveBeenCalledTimes(1);
            expect(belongingDashboardOutputMock.remove).toHaveBeenCalledWith(belongingUID);
        });
    });
});
