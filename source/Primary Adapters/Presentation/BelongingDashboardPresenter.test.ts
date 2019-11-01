import { DashboardBelonging, DashboardBelongingUpdate } from '../../Core/Ports/BelongingDashboardOutput';
import { HomeViewModel, BelongingViewData } from './HomeViewModel';
import BelongingDashboardPresenter from './BelongingDashboardPresenter';
import Theme from './Theme';

const belongings: DashboardBelonging[] = [
    {
        uid: 'randomUUID01',
        name: 'Keys',
        isSafe: true,
        lastSeen: new Date(),
    },
    {
        uid: 'randomUUID02',
        name: 'Laptop',
        isSafe: false,
        lastSeen: new Date('2011-10-05T14:48:00.000Z'),
    },
];
const belongingsViewData: BelongingViewData[] = [
    {
        uid: 'randomUUID01',
        name: 'Keys',
        safeStatusColor: Theme.Color.Green,
        lastSeen: 'Just now',
    },
    {
        uid: 'randomUUID02',
        name: 'Laptop',
        safeStatusColor: Theme.Color.Error,
        lastSeen: '2011-10-5',
    },
];
const viewModel = new HomeViewModel();
const belongingDashboardPresenter = new BelongingDashboardPresenter(viewModel);

test('show all current belongings', (): void => {
    expect.assertions(1);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings).toEqual(belongingsViewData);
    });

    belongingDashboardPresenter.showAll(belongings);
});

test('show no current belongings', (): void => {
    expect.assertions(1);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.showEmptyBelongings).toEqual(true);
    });

    belongingDashboardPresenter.showNone();
});

test('show added belonging', (): void => {
    const newBelonging: DashboardBelonging = {
        uid: 'randomUUID03',
        name: 'Wallet',
        isSafe: true,
        lastSeen: new Date(),
    };
    const newBelongingViewData: BelongingViewData = {
        uid: 'randomUUID03',
        name: 'Wallet',
        safeStatusColor: Theme.Color.Green,
        lastSeen: 'Just now',
    };

    expect.assertions(1);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings[2]).toEqual(newBelongingViewData);
    });

    belongingDashboardPresenter.add(newBelonging);
});

test('show belonging update', (): void => {
    const now = new Date();
    const belongingUpdate: DashboardBelongingUpdate = {
        uid: 'randomUUID02',
        isSafe: true,
        lastSeen: now,
    };
    const belongingUpdateViewData: BelongingViewData = {
        uid: 'randomUUID02',
        name: 'Laptop',
        safeStatusColor: Theme.Color.Green,
        lastSeen: 'Just now',
    };

    expect.assertions(1);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings[1]).toEqual(belongingUpdateViewData);
    });

    belongingDashboardPresenter.update(belongingUpdate);
});
