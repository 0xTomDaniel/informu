import { BelongingDashboardOutput, DashboardBelonging, DashboardBelongingUpdate } from '../../Core/Ports/BelongingDashboardOutput';
import { HomeViewModel, BelongingViewData, BelongingViewDataDelta } from './HomeViewModel';
import Theme from './Theme';

export default class BelongingDashboardPresenter implements BelongingDashboardOutput {

    private static readonly hoursInDay = 24;
    private static readonly minutesInHour = 60;
    private static readonly secondsInMinute = 60;
    private static readonly millisecondsInSecond = 1000;

    private readonly viewModel: HomeViewModel;
    private belongingsLastSeenCache = new Map<string, Date>();
    private lastSeenDisplayUpdateTimerID?: NodeJS.Timeout;
    private lastSeenDisplayUpdateMSInterval = 15000;

    constructor(viewModel: HomeViewModel) {
        this.viewModel = viewModel;
    }

    showAll(belongings: DashboardBelonging[]): void {
        const belongingsViewData: BelongingViewData[] = [];
        belongings.forEach((belonging): void => {
            belongingsViewData.push(BelongingDashboardPresenter
                .toBelongingViewData(belonging));
            this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);
        });

        this.viewModel.updateState({
            showEmptyBelongings: false,
            belongings: belongingsViewData,
        });
        this.startUpdatingLastSeenDisplay();
    }

    showNone(): void {
        this.viewModel.updateState({
            showEmptyBelongings: true,
        });
    }

    add(belonging: DashboardBelonging): void {
        this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);
        const belongingViewData
            = BelongingDashboardPresenter.toBelongingViewData(belonging);
        this.viewModel.updateState({
            showEmptyBelongings: false,
            belongings: [belongingViewData],
        });
        if (this.belongingsLastSeenCache.size === 1) {
            this.startUpdatingLastSeenDisplay();
        }
    }

    update(belonging: DashboardBelongingUpdate): void {
        if (belonging.lastSeen != null) {
            this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);
        }

        const belongingViewDataDelta = Object.entries(belonging)
            .reduce((accumulator, [key, value]): BelongingViewDataDelta => {
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
            // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
            }, {} as BelongingViewDataDelta);

        this.viewModel.updateState({
            showEmptyBelongings: false,
            belongings: [belongingViewDataDelta],
        });
    }

    remove(belongingUID: string): void {
        this.belongingsLastSeenCache.delete(belongingUID);
        const index = this.viewModel.state.belongings.findIndex((belonging): void => {
            belonging.uid === belongingUID;
        });
        this.viewModel.state.belongings.splice(index, 1);
        if (this.belongingsLastSeenCache.size === 0) {
            this.stopUpdatingLastSeenDisplay();
        }
    }

    private startUpdatingLastSeenDisplay(): void {
        this.lastSeenDisplayUpdateTimerID = setInterval((): void => {
            const belongingsViewDataDelta: BelongingViewDataDelta[] = [];
            this.belongingsLastSeenCache.forEach((lastSeen, uid): void => {
                const lastSeenDisplay
                    = BelongingDashboardPresenter.lastSeenDisplay(lastSeen);
                belongingsViewDataDelta.push({ uid: uid, lastSeen: lastSeenDisplay });
            });
            this.viewModel.updateState({
                belongings: belongingsViewDataDelta,
            });
        }, this.lastSeenDisplayUpdateMSInterval);
    }

    private stopUpdatingLastSeenDisplay(): void {
        if (this.lastSeenDisplayUpdateTimerID != null) {
            clearTimeout(this.lastSeenDisplayUpdateTimerID);
        }
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

        if (daysSinceLastSeen >= 7) {
            return timestamp.toLocaleDateString();
        } else if (daysSinceLastSeen >= 1) {
            return `${daysSinceLastSeen}d ago`;
        } else if (hoursSinceLastSeen >= 1) {
            return `${hoursSinceLastSeen}h ago`;
        } else if (minutesSinceLastSeen >= 1) {
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

        return Math.floor(Math.abs((diffInMilliseconds) / oneDayInMilliseconds));
    }

    private static hoursBetween(firstDate: Date, secondDate: Date): number {
        const oneHourInMilliseconds
            = this.minutesInHour * this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.floor(Math.abs((diffInMilliseconds) / oneHourInMilliseconds));
    }

    private static minutesBetween(firstDate: Date, secondDate: Date): number {
        const oneMinuteInMilliseconds = this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.floor(Math.abs((diffInMilliseconds) / oneMinuteInMilliseconds));
    }
}
