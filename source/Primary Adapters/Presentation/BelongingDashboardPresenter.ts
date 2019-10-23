import { BelongingDashboardOutput, DashboardBelonging } from '../../Core/Ports/BelongingDashboardOutput';
import { HomeViewModel, BelongingViewData } from './HomeViewModel';
import Theme from './Theme';

export default class BelongingDashboardPresenter implements BelongingDashboardOutput {

    private readonly viewModel: HomeViewModel;
    private readonly hoursInDay = 24;
    private readonly minutesInHour = 60;
    private readonly secondsInMinute = 60;
    private readonly millisecondsInSecond = 1000;

    constructor(viewModel: HomeViewModel) {
        this.viewModel = viewModel;
    }

    showAll(belongings: DashboardBelonging[]): void {
        const belongingsViewData: BelongingViewData[] = [];
        belongings.forEach((belonging): void => {
            belongingsViewData.push({
                uid: belonging.uid,
                name: belonging.name,
                safeStatusColor: this.safeStatusColor(belonging.isSafe),
                lastSeen: this.lastSeenDisplay(belonging.lastSeen),
            });
        });
        this.viewModel.state.belongings = belongingsViewData;
    }

    private safeStatusColor(isSafe: boolean): string {
        return isSafe ? Theme.Color.Green : Theme.Color.Error;
    }

    private lastSeenDisplay(timestamp: Date): string {
        const now = new Date();
        const daysSinceLastSeen = this.daysBetween(timestamp, now);
        const hoursSinceLastSeen = this.hoursBetween(timestamp, now);
        const minutesSinceLastSeen = this.minutesBetween(timestamp, now);

        if (daysSinceLastSeen > 6) {
            return timestamp.toLocaleDateString();
        } else if (daysSinceLastSeen > 1) {
            return `${daysSinceLastSeen}d ago`;
        } else if (hoursSinceLastSeen > 1) {
            return `${hoursSinceLastSeen}d ago`;
        } else if (minutesSinceLastSeen > 1) {
            return `${minutesSinceLastSeen}d ago`;
        } else {
            return 'Just now';
        }
    }

    private daysBetween(firstDate: Date, secondDate: Date): number {
        const oneDayInMilliseconds = this.hoursInDay
            * this.minutesInHour
            * this.secondsInMinute
            * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneDayInMilliseconds));
    }

    private hoursBetween(firstDate: Date, secondDate: Date): number {
        const oneHourInMilliseconds
            = this.minutesInHour * this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneHourInMilliseconds));
    }

    private minutesBetween(firstDate: Date, secondDate: Date): number {
        const oneMinuteInMilliseconds = this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.round(Math.abs((diffInMilliseconds) / oneMinuteInMilliseconds));
    }
}
