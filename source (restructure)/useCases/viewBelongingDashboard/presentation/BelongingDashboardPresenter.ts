import {
    BelongingDashboardOutputPort,
    DashboardBelonging,
    DashboardBelongingUpdate
} from "../BelongingDashboardOutputPort";
import {
    BelongingDashboardViewModel,
    BelongingViewData,
    BelongingViewDataDelta
} from "./BelongingDashboardViewModel";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import _ from "lodash";

export default class BelongingDashboardPresenter
    implements BelongingDashboardOutputPort {
    private static readonly hoursInDay = 24;
    private static readonly minutesInHour = 60;
    private static readonly secondsInMinute = 60;
    private static readonly millisecondsInSecond = 1000;

    private readonly viewModel: BelongingDashboardViewModel;
    private belongingsSafeStatusCache = new Map<string, boolean>();
    private belongingsLastSeenCache = new Map<string, Date>();
    private lastSeenDisplayUpdateTimerID?: NodeJS.Timeout;
    private lastSeenDisplayUpdateMSInterval = 15000;

    constructor(viewModel: BelongingDashboardViewModel) {
        this.viewModel = viewModel;
    }

    showAll(belongings: DashboardBelonging[]): void {
        const belongingsViewData: BelongingViewData[] = [];
        belongings.forEach((belonging): void => {
            belongingsViewData.push(
                BelongingDashboardPresenter.toBelongingViewData(belonging)
            );
            this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);
        });

        this.viewModel.updateState({
            showEmptyBelongings: false,
            belongings: belongingsViewData
        });
        this.startUpdatingLastSeenDisplay();
    }

    showNone(): void {
        this.viewModel.updateState({
            showEmptyBelongings: true
        });
    }

    add(belonging: DashboardBelonging): void {
        this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);

        const belongingViewData = BelongingDashboardPresenter.toBelongingViewData(
            belonging
        );
        const allBelongingsWithAdded = this.addExistingBelongings(
            belongingViewData
        );

        this.viewModel.updateState({
            showEmptyBelongings: false,
            belongings: allBelongingsWithAdded
        });

        if (this.belongingsLastSeenCache.size === 1) {
            this.startUpdatingLastSeenDisplay();
        }
    }

    update(belonging: DashboardBelongingUpdate): void {
        const belongingUpdate = Object.assign({}, belonging);

        if (belonging.isSafe != null) {
            this.belongingsSafeStatusCache.set(belonging.uid, belonging.isSafe);

            if (
                belonging.lastSeen == null &&
                this.belongingsLastSeenCache.has(belonging.uid)
            ) {
                const lastSeen = this.belongingsLastSeenCache.get(
                    belonging.uid
                );
                Object.assign(belongingUpdate, { lastSeen: lastSeen });
            }
        }

        if (belonging.lastSeen != null) {
            this.belongingsLastSeenCache.set(belonging.uid, belonging.lastSeen);
        }

        const belongingViewDataDelta = Object.entries(belongingUpdate).reduce(
            (accumulator, [key, value]): BelongingViewDataDelta => {
                let convertedKey = key;
                let convertedValue = value;
                switch (key) {
                    case "isSafe":
                        convertedKey = "safeStatusColor";
                        convertedValue = BelongingDashboardPresenter.safeStatusColor(
                            value
                        );
                        break;
                    case "lastSeen":
                        convertedValue = BelongingDashboardPresenter.lastSeenDisplay(
                            value,
                            this.belongingsSafeStatusCache.get(belonging.uid)
                        );
                        break;
                }
                return Object.assign(accumulator, {
                    [convertedKey]: convertedValue
                });
            },
            {} as BelongingViewDataDelta
        );

        const allBelongingsWithDelta = this.addExistingBelongings(
            belongingViewDataDelta
        );

        this.viewModel.updateState({
            belongings: allBelongingsWithDelta
        });
    }

    remove(belongingUid: string): void {
        this.belongingsLastSeenCache.delete(belongingUid);

        const existingBelongings = _.map(
            this.viewModel.state.belongings,
            (belonging): BelongingViewDataDelta => _.pick(belonging, "uid")
        );
        const belongings = _.differenceBy(
            existingBelongings,
            [{ uid: belongingUid }],
            "uid"
        );
        const homeStateDelta: { [key: string]: any } = {
            belongings: belongings
        };

        if (this.belongingsLastSeenCache.size === 0) {
            this.stopUpdatingLastSeenDisplay();
            homeStateDelta.showEmptyBelongings = true;
        }

        this.viewModel.updateState(homeStateDelta);
    }

    private startUpdatingLastSeenDisplay(): void {
        this.lastSeenDisplayUpdateTimerID = setInterval((): void => {
            const belongingsViewDataDelta: BelongingViewDataDelta[] = [];
            this.belongingsLastSeenCache.forEach((lastSeen, uid): void => {
                const isSafe = this.belongingsSafeStatusCache.get(uid);
                const lastSeenDisplay = BelongingDashboardPresenter.lastSeenDisplay(
                    lastSeen,
                    isSafe
                );
                belongingsViewDataDelta.push({
                    uid: uid,
                    lastSeen: lastSeenDisplay
                });
            });
            this.viewModel.updateState({
                belongings: belongingsViewDataDelta
            });
        }, this.lastSeenDisplayUpdateMSInterval);
    }

    private stopUpdatingLastSeenDisplay(): void {
        if (this.lastSeenDisplayUpdateTimerID != null) {
            clearTimeout(this.lastSeenDisplayUpdateTimerID);
        }
    }

    private addExistingBelongings(
        belongingDelta: BelongingViewDataDelta
    ): BelongingViewDataDelta[] {
        const existingBelongings = _.map(
            this.viewModel.state.belongings,
            (belonging): BelongingViewDataDelta => _.pick(belonging, "uid")
        );
        return _.unionBy([belongingDelta], existingBelongings, "uid");
    }

    private static toBelongingViewData(
        belonging: DashboardBelonging
    ): BelongingViewData {
        return {
            uid: belonging.uid,
            name: belonging.name,
            safeStatusColor: this.safeStatusColor(belonging.isSafe),
            lastSeen: this.lastSeenDisplay(
                belonging.lastSeen,
                belonging.isSafe
            ),
            address:
                belonging.address != null ? belonging.address : "searching..."
        };
    }

    private static safeStatusColor(isSafe: boolean): string {
        return isSafe ? Theme.Color.Green : Theme.Color.Error;
    }

    private static lastSeenDisplay(
        timestamp: Date,
        isSafe: boolean | undefined
    ): string {
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
        } else if (isSafe != null && !isSafe) {
            return "Seconds ago";
        } else {
            return "Just now";
        }
    }

    private static daysBetween(firstDate: Date, secondDate: Date): number {
        const oneDayInMilliseconds =
            this.hoursInDay *
            this.minutesInHour *
            this.secondsInMinute *
            this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.floor(Math.abs(diffInMilliseconds / oneDayInMilliseconds));
    }

    private static hoursBetween(firstDate: Date, secondDate: Date): number {
        const oneHourInMilliseconds =
            this.minutesInHour *
            this.secondsInMinute *
            this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.floor(Math.abs(diffInMilliseconds / oneHourInMilliseconds));
    }

    private static minutesBetween(firstDate: Date, secondDate: Date): number {
        const oneMinuteInMilliseconds =
            this.secondsInMinute * this.millisecondsInSecond;
        const diffInMilliseconds = firstDate.getTime() - secondDate.getTime();

        return Math.floor(
            Math.abs(diffInMilliseconds / oneMinuteInMilliseconds)
        );
    }
}
