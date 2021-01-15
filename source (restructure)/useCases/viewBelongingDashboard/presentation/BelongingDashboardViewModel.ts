import BelongingDashboardInteractor, {
    DashboardBelonging
} from "../BelongingDashboardInteractor";
import { Observable, combineLatest, timer } from "rxjs";
import {
    scan,
    map,
    publishBehavior,
    refCount,
    distinctUntilChanged,
    share
} from "rxjs/operators";
import Percent from "../../../shared/metaLanguage/Percent";
import { Millisecond } from "../../../shared/metaLanguage/Types";
import SignOutInteractor, {
    SignOutInteractorException
} from "../../signOut/SignOutInteractor";
import RemoveMuTagInteractor, {
    RemoveMuTagInteractorException
} from "../../removeMuTag/RemoveMuTagInteractor";
import { isEqual } from "lodash";
import ViewModel from "../../../shared/viewModel/ViewModel";
import NavigationPort from "../../../shared/navigation/NavigationPort";

export type BatteryBarLevel =
    | "0%"
    | "10%"
    | "20%"
    | "30%"
    | "40%"
    | "50%"
    | "60%"
    | "70%"
    | "80%"
    | "90%"
    | "100%";

export type BatteryLevelRange = "High" | "Medium" | "Low";

type LastSeenInterval = {
    type: "Interval";
    count: number;
    unit: "Day" | "Hour" | "Minute";
};

type LastSeenDate = {
    type: "Date";
    date: Date;
};

type LastSeenRecent = {
    type: "Recent";
    state: "Now" | "Seconds";
};

export type LastSeen = LastSeenInterval | LastSeenDate | LastSeenRecent;

export type SafeStatus = "InRange" | "InSafeZone" | "Unsafe";

export interface BelongingViewData {
    readonly address?: string;
    readonly batteryBarLevel: BatteryBarLevel;
    readonly batteryLevelRange: BatteryLevelRange;
    readonly lastSeen: LastSeen;
    readonly name: string;
    readonly safeStatus: SafeStatus;
    readonly uid: string;
}

export type LowPriorityMessage = typeof BelongingDashboardViewModel.lowPriorityMessages[number];
export type MediumPriorityMessage = typeof BelongingDashboardViewModel.mediumPriorityMessages[number];
type Route = typeof BelongingDashboardViewModel.routes[number];

export default class BelongingDashboardViewModel extends ViewModel<
    Route,
    undefined,
    LowPriorityMessage,
    MediumPriorityMessage
> {
    readonly showBelongings: Observable<BelongingViewData[]>;
    readonly showEmptyDashboard: Observable<boolean>;

    constructor(
        navigation: NavigationPort<Route>,
        belongingDashboardInteractor: BelongingDashboardInteractor,
        removeMuTagInteractor: RemoveMuTagInteractor,
        signOutInteractor: SignOutInteractor
    ) {
        super(navigation);
        this.belongingDashboardInteractor = belongingDashboardInteractor;
        this.dashboardBelongings = this.belongingDashboardInteractor.showOnDashboard.pipe(
            scan(
                (accumulated, update) => update.applyTo(accumulated),
                [] as DashboardBelonging[]
            ),
            share()
        );
        this.removeMuTagInteractor = removeMuTagInteractor;
        this.showBelongings = combineLatest(
            this.dashboardBelongings,
            timer(0, This.lastSeenDisplayUpdateInterval)
        ).pipe(
            map(([dashboardBelongings]) =>
                dashboardBelongings.map(dashboardBelonging =>
                    BelongingDashboardViewModel.convertToBelongingViewData(
                        dashboardBelonging
                    )
                )
            ),
            distinctUntilChanged(isEqual)
        );
        this.showEmptyDashboard = this.dashboardBelongings.pipe(
            map(belongings => belongings.length === 0),
            distinctUntilChanged(),
            publishBehavior(true),
            refCount()
        );
        this.signOutInteractor = signOutInteractor;
    }

    addMuTag(): void {
        this.navigation.navigateTo("AddMuTag");
    }

    async removeMuTag(uid: string): Promise<void> {
        this.showProgressIndicator("Indeterminate");
        await this.removeMuTagInteractor
            .remove(uid)
            .finally(() => this.hideProgressIndicator())
            .catch(e => {
                if (RemoveMuTagInteractorException.isType(e)) {
                    switch (e.type) {
                        case "FailedToFindMuTag":
                        case "LowMuTagBattery":
                            this.showLowPriorityMessage(e.type, 4);
                            break;
                        case "FailedToRemoveMuTagFromAccount":
                        case "FailedToResetMuTag":
                            this.showMediumPriorityMessage(e.type);
                            break;
                    }
                } else {
                    throw e;
                }
            });
    }

    async signOut(): Promise<void> {
        this.showProgressIndicator("Indeterminate");
        await this.signOutInteractor
            .signOut()
            .finally(() => this.hideProgressIndicator())
            .then(() => this.navigation.navigateTo("SignIn"))
            .catch(e => {
                if (SignOutInteractorException.isType(e)) {
                    this.showMediumPriorityMessage(e.type);
                } else {
                    throw e;
                }
            });
    }

    private readonly belongingDashboardInteractor: BelongingDashboardInteractor;
    private readonly dashboardBelongings: Observable<DashboardBelonging[]>;
    private readonly removeMuTagInteractor: RemoveMuTagInteractor;
    private readonly signOutInteractor: SignOutInteractor;

    static readonly lowPriorityMessages = [
        "FailedToFindMuTag",
        "LowMuTagBattery"
    ] as const;
    static readonly mediumPriorityMessages = [
        "FailedToRemoveMuTagFromAccount",
        "FailedToResetMuTag",
        "SignOutFailed"
    ] as const;
    static readonly routes = ["AddMuTag", "SignIn"] as const;

    private static readonly hoursInDay = 24;
    private static readonly lastSeenDisplayUpdateInterval = 15000 as Millisecond;
    private static readonly millisecondsInSecond = 1000;
    private static readonly minutesInHour = 60;
    private static readonly secondsInMinute = 60;

    private static convertToBelongingViewData(
        dashboardBelonging: DashboardBelonging
    ): BelongingViewData {
        return {
            address: dashboardBelonging.address,
            batteryBarLevel: BelongingDashboardViewModel.getBatteryBarLevel(
                dashboardBelonging.batteryLevel
            ),
            batteryLevelRange: BelongingDashboardViewModel.getBatteryLevelRange(
                dashboardBelonging.batteryLevel
            ),
            lastSeen: BelongingDashboardViewModel.getLastSeen(
                dashboardBelonging.lastSeen,
                dashboardBelonging.isSafe
            ),
            name: dashboardBelonging.name,
            safeStatus: BelongingDashboardViewModel.getSafeStatus(
                dashboardBelonging.isSafe
            ),
            uid: dashboardBelonging.uid
        };
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

    private static getBatteryBarLevel(percentage: Percent): BatteryBarLevel {
        const percentValue = Math.round(percentage.valueOf() / 10);
        switch (percentValue) {
            case 0:
                return "0%";
            case 1:
                return "10%";
            case 2:
                return "20%";
            case 3:
                return "30%";
            case 4:
                return "40%";
            case 5:
                return "50%";
            case 6:
                return "60%";
            case 7:
                return "70%";
            case 8:
                return "80%";
            case 9:
                return "90%";
            case 10:
                return "100%";
            default:
                throw Error(`${percentValue} is an invalid BatteryBarLevel.`);
        }
    }

    private static getBatteryLevelRange(
        percentage: Percent
    ): BatteryLevelRange {
        if (percentage.valueOf() >= 45) {
            return "High";
        } else if (percentage.valueOf() >= 25) {
            return "Medium";
        } else {
            return "Low";
        }
    }

    private static getLastSeen(
        timestamp: Date,
        isSafe: boolean | undefined
    ): LastSeen {
        const now = new Date();

        const daysSinceLastSeen = this.daysBetween(timestamp, now);

        if (daysSinceLastSeen >= 7) {
            return {
                type: "Date",
                date: timestamp
            };
        }

        if (daysSinceLastSeen >= 1) {
            return {
                type: "Interval",
                count: daysSinceLastSeen,
                unit: "Day"
            };
        }

        const hoursSinceLastSeen = this.hoursBetween(timestamp, now);
        if (hoursSinceLastSeen >= 1) {
            return {
                type: "Interval",
                count: hoursSinceLastSeen,
                unit: "Hour"
            };
        }

        const minutesSinceLastSeen = this.minutesBetween(timestamp, now);
        if (minutesSinceLastSeen >= 1) {
            return {
                type: "Interval",
                count: minutesSinceLastSeen,
                unit: "Minute"
            };
        }

        if (isSafe != null && !isSafe) {
            return {
                type: "Recent",
                state: "Seconds"
            };
        }

        return {
            type: "Recent",
            state: "Now"
        };
    }

    private static getSafeStatus(isSafe: boolean): SafeStatus {
        return isSafe ? "InRange" : "Unsafe";
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

const This = BelongingDashboardViewModel;
