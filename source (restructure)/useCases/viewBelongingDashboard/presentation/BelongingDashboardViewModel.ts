import BelongingDashboardInteractor, {
    DashboardBelonging
} from "../BelongingDashboardInteractor";
import { Observable, combineLatest, timer, Subject, merge } from "rxjs";
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
import { UserErrorViewData } from "../../../shared/metaLanguage/UserError";
import SignOutInteractor from "../../signOut/SignOutInteractor";

export enum BatteryBarLevel {
    "0%",
    "10%",
    "20%",
    "30%",
    "40%",
    "50%",
    "60%",
    "70%",
    "80%",
    "90%",
    "100%"
}

export enum BatteryLevelRange {
    High,
    Medium,
    Low
}

export enum SafeStatus {
    InRange,
    InSafeZone,
    Unsafe
}

export interface BelongingViewData {
    readonly address: string;
    readonly batteryBarLevel: BatteryBarLevel;
    readonly batteryLevelRange: BatteryLevelRange;
    readonly lastSeen: string;
    readonly name: string;
    readonly safeStatus: SafeStatus;
    readonly uid: string;
}

export enum AppView {
    AddMuTag,
    SignIn
}

export default class BelongingDashboardViewModel {
    private static readonly hoursInDay = 24;
    private static readonly minutesInHour = 60;
    private static readonly secondsInMinute = 60;
    private static readonly millisecondsInSecond = 1000;

    private readonly belongingDashboardInteractor: BelongingDashboardInteractor;
    private readonly dashboardBelongings: Observable<DashboardBelonging[]>;
    private readonly lastSeenDisplayUpdateInterval = 15000 as Millisecond;
    private readonly navigateToViewSubject = new Subject<AppView>();
    readonly navigateToView = this.navigateToViewSubject.asObservable();
    private readonly showActivityIndicatorSubject = new Subject<boolean>();
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    readonly showBelongings: Observable<BelongingViewData[]>;
    readonly showEmptyDashboard: Observable<boolean>;
    readonly showError: Observable<UserErrorViewData>;
    private readonly signOutInteractor: SignOutInteractor;

    constructor(
        belongingDashboardInteractor: BelongingDashboardInteractor,
        signOutInteractor: SignOutInteractor
    ) {
        this.belongingDashboardInteractor = belongingDashboardInteractor;
        this.dashboardBelongings = this.belongingDashboardInteractor.showOnDashboard.pipe(
            scan(
                (accumulated, update) => update.applyTo(accumulated),
                [] as DashboardBelonging[]
            ),
            share()
        );
        this.showBelongings = combineLatest(
            this.dashboardBelongings,
            timer(0, this.lastSeenDisplayUpdateInterval)
        ).pipe(
            map(([dashboardBelongings]) =>
                dashboardBelongings.map(dashboardBelonging =>
                    BelongingDashboardViewModel.convertToBelongingViewData(
                        dashboardBelonging
                    )
                )
            ),
            distinctUntilChanged()
        );
        this.showEmptyDashboard = this.dashboardBelongings.pipe(
            map(belongings => belongings.length === 0),
            distinctUntilChanged(),
            publishBehavior(true),
            refCount()
        );
        this.signOutInteractor = signOutInteractor;
        this.showError = merge(this.signOutInteractor.showError).pipe(
            map(e => e.toViewData())
        );
    }

    signOut(): void {
        this.signOutInteractor.signOut();
    }

    private static convertToBelongingViewData(
        dashboardBelonging: DashboardBelonging
    ): BelongingViewData {
        return {
            address: dashboardBelonging.address ?? "no location name found",
            batteryBarLevel: BelongingDashboardViewModel.getBatteryBarLevel(
                dashboardBelonging.batteryLevel
            ),
            batteryLevelRange: BelongingDashboardViewModel.getBatteryLevelRange(
                dashboardBelonging.batteryLevel
            ),
            lastSeen: BelongingDashboardViewModel.getLastSeenDisplay(
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

    private static getBatteryBarLevel(percentage: Percent): BatteryBarLevel {
        return Math.round(percentage.valueOf() / 10);
    }

    private static getBatteryLevelRange(
        percentage: Percent
    ): BatteryLevelRange {
        if (percentage.valueOf() >= 45) {
            return BatteryLevelRange.High;
        } else if (percentage.valueOf() >= 25) {
            return BatteryLevelRange.Medium;
        } else {
            return BatteryLevelRange.Low;
        }
    }

    private static getSafeStatus(isSafe: boolean): SafeStatus {
        return isSafe ? SafeStatus.InRange : SafeStatus.Unsafe;
    }

    private static getLastSeenDisplay(
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
