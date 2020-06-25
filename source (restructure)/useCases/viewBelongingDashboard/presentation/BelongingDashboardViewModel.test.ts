import { expect, jest, test } from "@jest/globals";
import BelongingDashboardViewModel, {
    BelongingViewData,
    BatteryBarLevel,
    BatteryLevelRange,
    SafeStatus
} from "./BelongingDashboardViewModel";
import BelongingDashboardInteractor, {
    DashboardBelonging,
    DashboardBelongingDelta
} from "../BelongingDashboardInteractor";
import { take, skip } from "rxjs/operators";
import { Subject } from "rxjs";
import ObjectCollectionUpdate from "../../../shared/metaLanguage/ObjectCollectionUpdate";
import Percent from "../../../shared/metaLanguage/Percent";
import { fakeSchedulers } from "rxjs-marbles/jest";

const showOnDashboardSubject = new Subject<
    ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
>();
const BelongingMapInteractorMock = jest.fn<BelongingDashboardInteractor, any>(
    (): BelongingDashboardInteractor => ({
        showOnDashboard: showOnDashboardSubject
    })
);
const belongingMapInteractorMock = BelongingMapInteractorMock();
const viewModel = new BelongingDashboardViewModel(belongingMapInteractorMock);
const belongings: DashboardBelonging[] = [
    {
        address: "Lamar St, Arvada, CO",
        batteryLevel: new Percent(94),
        isSafe: true,
        lastSeen: new Date(),
        name: "Keys",
        uid: "randomUUID01"
    },
    {
        batteryLevel: new Percent(15),
        isSafe: false,
        lastSeen: new Date("2011-10-05T14:48:00.000Z"),
        name: "Laptop",
        uid: "randomUUID02"
    }
];
const belongingsViewData: BelongingViewData[] = [
    {
        address: "Lamar St, Arvada, CO",
        batteryBarLevel: BatteryBarLevel["90%"],
        batteryLevelRange: BatteryLevelRange.High,
        lastSeen: "Just now",
        name: "Keys",
        safeStatus: SafeStatus.InRange,
        uid: "randomUUID01"
    },
    {
        address: "no location name found",
        batteryBarLevel: BatteryBarLevel["20%"],
        batteryLevelRange: BatteryLevelRange.Low,
        lastSeen: "10/5/2011",
        name: "Laptop",
        safeStatus: SafeStatus.Unsafe,
        uid: "randomUUID02"
    }
];

test("show empty dashboard", async (): Promise<void> => {
    expect.assertions(1);
    await new Promise((resolve, reject) => {
        viewModel.showEmptyDashboard.pipe(take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(true),
            e => reject(e),
            () => resolve()
        );
    });
});

test("show all current belongings", async (): Promise<void> => {
    expect.assertions(2);
    await new Promise((resolve, reject) => {
        let completed = 0;
        const resolveWhenAllCompleted = (): void => {
            completed += 1;
            if (completed === 2) {
                resolve();
            }
        };
        viewModel.showBelongings.pipe(take(1)).subscribe(
            currentBelongings =>
                expect(currentBelongings).toEqual(belongingsViewData),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        viewModel.showEmptyDashboard.pipe(skip(1), take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(false),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        showOnDashboardSubject.next(new ObjectCollectionUpdate(belongings));
    });
});

test("show added belonging", async (): Promise<void> => {
    const newBelonging: DashboardBelonging = {
        address: "Everett St, Arvada, CO",
        batteryLevel: new Percent(25),
        isSafe: true,
        lastSeen: new Date(),
        name: "Wallet",
        uid: "randomUUID03"
    };
    const newBelongingViewData: BelongingViewData = {
        address: "Everett St, Arvada, CO",
        batteryBarLevel: BatteryBarLevel["30%"],
        batteryLevelRange: BatteryLevelRange.Medium,
        lastSeen: "Just now",
        name: "Wallet",
        safeStatus: SafeStatus.InRange,
        uid: "randomUUID03"
    };
    belongingsViewData.splice(1, 0, newBelongingViewData);

    expect.assertions(2);
    await new Promise((resolve, reject) => {
        let completed = 0;
        const resolveWhenAllCompleted = (): void => {
            completed += 1;
            if (completed === 2) {
                resolve();
            }
        };
        viewModel.showBelongings.pipe(take(1)).subscribe(
            currentBelongings =>
                expect(currentBelongings).toEqual(belongingsViewData),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        viewModel.showEmptyDashboard.pipe(take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(false),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        showOnDashboardSubject.next(new ObjectCollectionUpdate(belongings));
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate(undefined, [
                {
                    index: 1,
                    element: newBelonging
                }
            ])
        );
        belongings.splice(1, 0, newBelonging);
    });
});

test("show belonging update", async (): Promise<void> => {
    const now = new Date();
    const belongingChange: DashboardBelongingDelta = {
        address: "Quitman St, Westminster, CO",
        batteryLevel: new Percent(14),
        isSafe: true,
        lastSeen: now,
        uid: "randomUUID02"
    };
    const belongingUpdateViewData: BelongingViewData = {
        address: "Quitman St, Westminster, CO",
        batteryBarLevel: BatteryBarLevel["10%"],
        batteryLevelRange: BatteryLevelRange.Low,
        lastSeen: "Just now",
        name: "Laptop",
        safeStatus: SafeStatus.InRange,
        uid: "randomUUID02"
    };
    belongingsViewData.splice(2, 1, belongingUpdateViewData);

    expect.assertions(2);
    await new Promise((resolve, reject) => {
        let completed = 0;
        const resolveWhenAllCompleted = (): void => {
            completed += 1;
            if (completed === 2) {
                resolve();
            }
        };
        viewModel.showBelongings.pipe(take(1)).subscribe(
            currentBelongings =>
                expect(currentBelongings).toEqual(belongingsViewData),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        viewModel.showEmptyDashboard.pipe(take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(false),
            e => reject(e),
            () => resolveWhenAllCompleted()
        );
        showOnDashboardSubject.next(new ObjectCollectionUpdate(belongings));
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate(undefined, undefined, undefined, [
                {
                    index: 2,
                    elementChange: belongingChange
                }
            ])
        );
        belongings.splice(2, 1, {
            address: belongingChange.address!,
            batteryLevel: belongingChange.batteryLevel!,
            isSafe: belongingChange.isSafe!,
            lastSeen: belongingChange.lastSeen!,
            name: "Wallet",
            uid: belongingChange.uid
        });
    });
});

let belonging01LastSeenChange: string;

test(
    "continuously update last seen message",
    fakeSchedulers(advance => {
        jest.useFakeTimers("modern");

        const oneSecondInMS = 1000;
        const oneMinuteInMS = oneSecondInMS * 60;
        const oneHourInMS = oneMinuteInMS * 60;
        const oneDayInMS = oneHourInMS * 24;

        let belongingsViewDataUpdate: BelongingViewData[] = [];

        const subscription = viewModel.showBelongings.subscribe(
            currentBelongings => (belongingsViewDataUpdate = currentBelongings),
            e => console.error(e)
        );

        showOnDashboardSubject.next(new ObjectCollectionUpdate(belongings));

        advance(oneSecondInMS * 5);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("Just now");

        advance(oneSecondInMS * 54);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("Just now");

        advance(oneSecondInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("1m ago");

        advance(oneMinuteInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("2m ago");

        advance(oneMinuteInMS * 57);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("59m ago");

        advance(oneMinuteInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("1h ago");

        advance(oneHourInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("2h ago");

        advance(oneHourInMS * 21);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("23h ago");

        advance(oneHourInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("1d ago");

        advance(oneDayInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("2d ago");

        advance(oneDayInMS * 4);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("6d ago");

        advance(oneDayInMS);
        const lastSeenViewDataDate = new Date();
        lastSeenViewDataDate.setDate(lastSeenViewDataDate.getDate() - 7);
        belonging01LastSeenChange = lastSeenViewDataDate.toLocaleDateString();
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual(
            belonging01LastSeenChange
        );

        const newLastSeenDate = new Date();
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate(undefined, undefined, undefined, [
                {
                    index: 1,
                    elementChange: {
                        uid: "randomUUID03",
                        isSafe: true,
                        lastSeen: newLastSeenDate
                    }
                }
            ])
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate(undefined, undefined, undefined, [
                {
                    index: 1,
                    elementChange: {
                        uid: "randomUUID03",
                        isSafe: false
                    }
                }
            ])
        );
        belongings.splice(1, 1, {
            address: belongings[1].address,
            batteryLevel: belongings[1].batteryLevel,
            isSafe: false,
            lastSeen: newLastSeenDate,
            name: belongings[1].name,
            uid: belongings[1].uid
        });

        advance(oneSecondInMS * 5);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("Seconds ago");

        advance(oneSecondInMS * 55);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual("1m ago");

        subscription.unsubscribe();
    })
);

test(
    "remove belonging",
    fakeSchedulers(advance => {
        const updatedBelongingsViewData: BelongingViewData[] = [
            {
                address: "Lamar St, Arvada, CO",
                batteryBarLevel: BatteryBarLevel["90%"],
                batteryLevelRange: BatteryLevelRange.High,
                uid: "randomUUID01",
                name: "Keys",
                safeStatus: SafeStatus.InRange,
                lastSeen: belonging01LastSeenChange
            },
            {
                address: "Everett St, Arvada, CO",
                batteryBarLevel: BatteryBarLevel["30%"],
                batteryLevelRange: BatteryLevelRange.Medium,
                uid: "randomUUID03",
                name: "Wallet",
                safeStatus: SafeStatus.Unsafe,
                lastSeen: "1m ago"
            }
        ];

        expect.assertions(2);
        viewModel.showBelongings.pipe(take(1)).subscribe(
            currentBelongings =>
                expect(currentBelongings).toEqual(updatedBelongingsViewData),
            e => console.error(e)
        );
        viewModel.showEmptyDashboard.pipe(take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(false),
            e => console.error(e)
        );
        showOnDashboardSubject.next(new ObjectCollectionUpdate(belongings));
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate(undefined, undefined, [
                {
                    index: 2
                }
            ])
        );

        advance(1);
        jest.useRealTimers();
    })
);
