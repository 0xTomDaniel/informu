import { BelongingDashboardOutput, DashboardBelonging, DashboardBelongingUpdate } from '../../Core/Ports/BelongingDashboardOutput';
import { HomeViewModel, BelongingViewData } from './HomeViewModel';
import Theme from './Theme';

export default class BelongingDashboardPresenter implements BelongingDashboardOutput {

    private static readonly hoursInDay = 24;
    private static readonly minutesInHour = 60;
    private static readonly secondsInMinute = 60;
    private static readonly millisecondsInSecond = 1000;

    private readonly viewModel: HomeViewModel;

    constructor(viewModel: HomeViewModel) {
        this.viewModel = viewModel;
    }

    showAll(belongings: DashboardBelonging[]): void {
        const belongingsViewData: BelongingViewData[] = [];
        belongings.forEach((belonging): void => {
            belongingsViewData.push(BelongingDashboardPresenter
                .toBelongingViewData(belonging));
        });
        this.viewModel.state.belongings = belongingsViewData;
    }

    showNone(): void {
        this.viewModel.state.showEmptyBelongings = true;
    }

    add(belonging: DashboardBelonging): void {
        const belongingViewData = BelongingDashboardPresenter.toBelongingViewData(belonging);
        this.viewModel.state.belongings.push(belongingViewData);
    }

    update(belonging: DashboardBelongingUpdate): void {
        const index = this.viewModel.state.belongings.findIndex((belongingViewData): boolean => {
            return belongingViewData.uid === belonging.uid;
        });
        const belongingViewDataUpdate = Object.entries(belonging)
            .filter((value): boolean => value[1] != null)
            .reduce((accumulator, [key, value]): object => {
                let convertedKey = key;
                let convertedValue = value;
                switch (key) {
                    case 'isSafe':
                        convertedKey = 'safeStatusColor';
                        convertedValue = BelongingDashboardPresenter.safeStatusColor(value);
                        break;
                    case 'lastSeen':
                        convertedValue = BelongingDashboardPresenter.lastSeenDisplay(value);
                        break;
                }
                return Object.assign(accumulator, { [convertedKey]: convertedValue });
            }, {});

        // Object.assign cannot assign directly to a proxy object.
        const belongingViewData = Object.assign(
            {},
            this.viewModel.state.belongings[index],
            belongingViewDataUpdate
        );
        this.viewModel.state.belongings[index] = belongingViewData;
    }

    remove(belongingUID: string): void {
        const index = this.viewModel.state.belongings.findIndex((belonging): void => {
            belonging.uid === belongingUID;
        });
        this.viewModel.state.belongings.splice(index, 1);
    }

    private static toBelongingViewData(belonging: DashboardBelonging): BelongingViewData {
        return {
            uid: belonging.uid,
            name: belonging.name,
            safeStatusColor: this.safeStatusColor(belonging.isSafe),
            lastSeen: this.lastSeenDisplay(belonging.lastSeen),
        };
    }

    private static safeStatusColor(isSafe: boolean): string {
        return isSafe ? Theme.Color.Green : Theme.Color.Error;
    }

    private static lastSeenDisplay(timestamp: Date): string {
        const now = new Date();
        const daysSinceLastSeen = this.daysBetween(timestamp, now);
        const hoursSinceLastSeen = this.hoursBetween(timestamp, now);
        const minutesSinceLastSeen = this.minutesBetween(timestamp, now);

        if (daysSinceLastSeen > 6) {
            return timestamp.toLocaleDateString();
        } else if (daysSinceLastSeen > 1) {
            return `${daysSinceLastSeen}d ago`;
        } else if (hoursSinceLastSeen > 1) {
            return `${hoursSinceLastSeen}h ago`;
        } else if (minutesSinceLastSeen > 1) {
            return `${minutesSinceLastSeen}m ago`;
        } else {
            return 'Just now';
        }
    }

    private static daysBetween(firstDate: Date, secondDate: Date): number {
        const oneDayInMilliseconds = this.hoursInDay
            * this.minutesInHour
            * this.secondsInMinute
            * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneDayInMilliseconds));
    }

    private static hoursBetween(firstDate: Date, secondDate: Date): number {
        const oneHourInMilliseconds
            = this.minutesInHour * this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneHourInMilliseconds));
    }

    private static minutesBetween(firstDate: Date, secondDate: Date): number {
        const oneMinuteInMilliseconds = this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneMinuteInMilliseconds));
    }
}
