import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import Percent from '../Domain/Percent';
import { BelongingDashboardOutput, DashboardBelonging } from '../Ports/BelongingDashboardOutput';
import BelongingDashboardService from './BelongingDashboardService';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';

describe('Mu tag user views a dashboard of all their belongings', (): void => {

    const BelongingDashboardOutputMock
        = jest.fn<BelongingDashboardOutput, any>((): BelongingDashboardOutput => ({
            showAll: jest.fn(),
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

    const belongingDashboardOutputMock = new BelongingDashboardOutputMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const belongingDashboardService = new BelongingDashboardService(
        belongingDashboardOutputMock,
        muTagRepoLocalMock,
    );
    const belongingsData = [
        {
            uid: 'randomUUID01',
            beaconID: BeaconID.create('0'),
            muTagNumber: 0,
            muTagName: 'Keys',
            batteryLevel: new Percent(50),
            isSafe: true,
            lastSeen: new Date(),
        },
        {
            uid: 'randomUUID02',
            beaconID: BeaconID.create('1'),
            muTagNumber: 1,
            muTagName: 'Laptop',
            batteryLevel: new Percent(50),
            isSafe: false,
            lastSeen: new Date('1995-12-17T03:24:00'),
        },
    ];
    const muTags = new Set([
        new ProvisionedMuTag(
            belongingsData[0].uid,
            belongingsData[0].beaconID,
            belongingsData[0].muTagNumber,
            belongingsData[0].muTagName,
            belongingsData[0].batteryLevel,
            belongingsData[0].isSafe,
            belongingsData[0].lastSeen,
        ),
        new ProvisionedMuTag(
            belongingsData[1].uid,
            belongingsData[1].beaconID,
            belongingsData[1].muTagNumber,
            belongingsData[1].muTagName,
            belongingsData[1].batteryLevel,
            belongingsData[1].isSafe,
            belongingsData[1].lastSeen,
        ),
    ]);

    describe('credentials are valid', (): void => {

        // Given that an account is logged in

        // Given account contains one or more belongings
        //
        const belongingsDashboardData: DashboardBelonging[] = [
            {
                uid: belongingsData[0].uid,
                name: belongingsData[0].muTagName,
                isSafe: belongingsData[0].isSafe,
                lastSeen: belongingsData[0].lastSeen,
            },
            {
                uid: belongingsData[1].uid,
                name: belongingsData[1].muTagName,
                isSafe: belongingsData[1].isSafe,
                lastSeen: belongingsData[1].lastSeen,
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
});
