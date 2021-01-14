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
import Localize from "../../../shared/localization/Localize";
import ViewModel from "../../../shared/viewModel/ViewModel";
import NavigationPort from "../../../shared/navigation/NavigationPort";

const localize = Localize.instance;

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

export type SafeStatus = "InRange" | "InSafeZone" | "Unsafe";

export interface BelongingViewData {
    readonly address: string;
    readonly batteryBarLevel: BatteryBarLevel;
    readonly batteryLevelRange: BatteryLevelRange;
    readonly lastSeen: string;
    readonly name: string;
    readonly safeStatus: SafeStatus;
    readonly uid: string;
}

export type AppView = "AddMuTag" | "SignIn";

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
            address:
                dashboardBelonging.address ??
                localize.getText(
                    "viewBelongingDashboard",
                    "belongingCard",
                    "noAddressName"
                ),
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
        const percentValue = Math.round(percentage.valueOf());
        switch (percentValue) {
            case 0:
                return "0%";
            case 10:
                return "10%";
            case 20:
                return "20%";
            case 30:
                return "30%";
            case 40:
                return "40%";
            case 50:
                return "50%";
            case 60:
                return "60%";
            case 70:
                return "70%";
            case 80:
                return "80%";
            case 90:
                return "90%";
            case 100:
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
            return `${daysSinceLastSeen}${localize.getText(
                "viewBelongingDashboard",
                "lastSeen",
                "daysAgo"
            )}`;
        } else if (hoursSinceLastSeen >= 1) {
            return `${hoursSinceLastSeen}${localize.getText(
                "viewBelongingDashboard",
                "lastSeen",
                "hoursAgo"
            )}`;
        } else if (minutesSinceLastSeen >= 1) {
            return `${minutesSinceLastSeen}${localize.getText(
                "viewBelongingDashboard",
                "lastSeen",
                "minutesAgo"
            )}`;
        } else if (isSafe != null && !isSafe) {
            return localize.getText(
                "viewBelongingDashboard",
                "lastSeen",
                "secondsAgo"
            );
        } else {
            return localize.getText(
                "viewBelongingDashboard",
                "lastSeen",
                "justNow"
            );
        }
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
