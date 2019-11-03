import { DashboardBelonging, DashboardBelongingUpdate } from '../../Core/Ports/BelongingDashboardOutput';
import { HomeViewModel, BelongingViewData } from './HomeViewModel';
import BelongingDashboardPresenter from './BelongingDashboardPresenter';
import Theme from './Theme';
import lolex from 'lolex';

const clock = lolex.install();
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
    expect.assertions(2);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings).toEqual(belongingsViewData);
        expect(newState.showEmptyBelongings).toEqual(false);
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

    expect.assertions(2);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings[2]).toEqual(newBelongingViewData);
        expect(newState.showEmptyBelongings).toEqual(false);
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

    expect.assertions(2);
    viewModel.onDidUpdate((newState): void => {
        expect(newState.belongings[1]).toEqual(belongingUpdateViewData);
        expect(newState.showEmptyBelongings).toEqual(false);
    });

    belongingDashboardPresenter.update(belongingUpdate);
});

test('continuously update last seen message', (): void => {
    const oneSecondInMS = 1000;
    const oneMinuteInMS = oneSecondInMS * 60;
    const oneHourInMS = oneMinuteInMS * 60;
    const oneDayInMS = oneHourInMS * 24;

    viewModel.onDidUpdate(undefined);

    clock.tick(oneSecondInMS * 59);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('Just now');

    clock.tick(oneSecondInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('1m ago');

    clock.tick(oneMinuteInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('2m ago');

    clock.tick(oneMinuteInMS * 57);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('59m ago');

    clock.tick(oneMinuteInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('1h ago');

    clock.tick(oneHourInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('2h ago');

    clock.tick(oneHourInMS * 21);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('23h ago');

    clock.tick(oneHourInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('1d ago');

    clock.tick(oneDayInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('2d ago');

    clock.tick(oneDayInMS * 4);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('6d ago');

    clock.tick(oneDayInMS);
    expect(viewModel.state.belongings[2].lastSeen).toEqual('1969-12-31');

    clock.uninstall();
});
