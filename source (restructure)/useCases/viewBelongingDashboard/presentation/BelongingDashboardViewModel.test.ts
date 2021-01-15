import { expect, jest, test } from "@jest/globals";
import BelongingDashboardViewModel, {
    BelongingViewData
} from "./BelongingDashboardViewModel";
import BelongingDashboardInteractor, {
    DashboardBelonging,
    DashboardBelongingDelta
} from "../BelongingDashboardInteractor";
import { take, skip } from "rxjs/operators";
import { Subject, Observable } from "rxjs";
import ObjectCollectionUpdate from "../../../shared/metaLanguage/ObjectCollectionUpdate";
import Percent from "../../../shared/metaLanguage/Percent";
import { fakeSchedulers } from "rxjs-marbles/jest";
import SignOutInteractor from "../../signOut/SignOutInteractor";
import RemoveMuTagInteractor from "../../removeMuTag/RemoveMuTagInteractor";
import { NavigationContainerComponent } from "react-navigation";
import NavigationPort from "../../../shared/navigation/NavigationPort";

type Routes = typeof BelongingDashboardViewModel.routes[number];

const navigationPortMocks = {
    navigateTo: jest.fn<void, [Routes]>(),
    onHardwareBackPress: jest.fn<Observable<void>, [boolean]>(),
    popToTop: jest.fn<void, []>(),
    setNavigator: jest.fn<void, [NavigationContainerComponent]>()
};
const NavigationPortMock = jest.fn<NavigationPort<Routes>, any>(
    (): NavigationPort<Routes> => ({
        routes: Object.assign(
            {},
            ...BelongingDashboardViewModel.routes.map(v => ({ [v]: v }))
        ),
        navigateTo: navigationPortMocks.navigateTo,
        onHardwareBackPress: navigationPortMocks.onHardwareBackPress,
        popToTop: navigationPortMocks.popToTop,
        setNavigator: navigationPortMocks.setNavigator
    })
);
const navigationPortMock = new NavigationPortMock();

//const showErrorSubject = new Subject<Exception<string>>();
const showOnDashboardSubject = new Subject<
    ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
>();
const BelongingDashboardInteractorMock = jest.fn<
    BelongingDashboardInteractor,
    any
>(
    (): BelongingDashboardInteractor => ({
        showOnDashboard: showOnDashboardSubject
    })
);
const belongingDashboardInteractorMock = BelongingDashboardInteractorMock();
const RemoveMuTagInteractorMock = jest.fn<RemoveMuTagInteractor, any>(
    (): RemoveMuTagInteractor => ({
        remove: jest.fn()
    })
);
const removeMuTagInteractorMock = RemoveMuTagInteractorMock();
const SignOutInteractorMock = jest.fn<SignOutInteractor, any>(
    (): SignOutInteractor => ({
        signOut: jest.fn()
    })
);
const signOutInteractorMock = SignOutInteractorMock();
const viewModel = new BelongingDashboardViewModel(
    navigationPortMock,
    belongingDashboardInteractorMock,
    removeMuTagInteractorMock,
    signOutInteractorMock
);
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
        address: undefined,
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
        batteryBarLevel: "90%",
        batteryLevelRange: "High",
        lastSeen: {
            type: "Recent",
            state: "Now"
        },
        name: "Keys",
        safeStatus: "InRange",
        uid: "randomUUID01"
    },
    {
        address: undefined,
        batteryBarLevel: "20%",
        batteryLevelRange: "Low",
        lastSeen: {
            type: "Date",
            date: new Date("2011-10-05T14:48:00.000Z")
        },
        name: "Laptop",
        safeStatus: "Unsafe",
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
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );
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
        batteryBarLevel: "30%",
        batteryLevelRange: "Medium",
        lastSeen: {
            type: "Recent",
            state: "Now"
        },
        name: "Wallet",
        safeStatus: "InRange",
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
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({
                added: [
                    {
                        index: 1,
                        element: newBelonging
                    }
                ]
            })
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
        batteryBarLevel: "10%",
        batteryLevelRange: "Low",
        lastSeen: {
            type: "Recent",
            state: "Now"
        },
        name: "Laptop",
        safeStatus: "InRange",
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
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({
                changed: [
                    {
                        index: 2,
                        elementChange: belongingChange
                    }
                ]
            })
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

let belonging01LastSeenChange: Date;

test(
    "continuously update last seen message",
    fakeSchedulers(advance => {
        expect.assertions(14);
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

        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );

        advance(oneSecondInMS * 5);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            state: "Now",
            type: "Recent"
        });

        advance(oneSecondInMS * 54);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            state: "Now",
            type: "Recent"
        });

        advance(oneSecondInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 1,
            type: "Interval",
            unit: "Minute"
        });

        advance(oneMinuteInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 2,
            type: "Interval",
            unit: "Minute"
        });

        advance(oneMinuteInMS * 57);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 59,
            type: "Interval",
            unit: "Minute"
        });

        advance(oneMinuteInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 1,
            type: "Interval",
            unit: "Hour"
        });

        advance(oneHourInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 2,
            type: "Interval",
            unit: "Hour"
        });

        advance(oneHourInMS * 21);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 23,
            type: "Interval",
            unit: "Hour"
        });

        advance(oneHourInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 1,
            type: "Interval",
            unit: "Day"
        });

        advance(oneDayInMS);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 2,
            type: "Interval",
            unit: "Day"
        });

        advance(oneDayInMS * 4);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 6,
            type: "Interval",
            unit: "Day"
        });

        advance(oneDayInMS);
        const lastSeenViewDataDate = new Date();
        lastSeenViewDataDate.setDate(lastSeenViewDataDate.getDate() - 7);
        belonging01LastSeenChange = lastSeenViewDataDate;
        if (belongingsViewDataUpdate[1].lastSeen.type === "Date") {
            expect(belongingsViewDataUpdate[1].lastSeen.date.getSeconds).toBe(
                belonging01LastSeenChange.getSeconds
            );
        }

        const newLastSeenDate = new Date();
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({
                changed: [
                    {
                        index: 1,
                        elementChange: {
                            uid: "randomUUID03",
                            isSafe: true,
                            lastSeen: newLastSeenDate
                        }
                    }
                ]
            })
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({
                changed: [
                    {
                        index: 1,
                        elementChange: {
                            uid: "randomUUID03",
                            isSafe: false
                        }
                    }
                ]
            })
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
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            state: "Seconds",
            type: "Recent"
        });

        advance(oneSecondInMS * 55);
        expect(belongingsViewDataUpdate[1].lastSeen).toEqual({
            count: 1,
            type: "Interval",
            unit: "Minute"
        });

        subscription.unsubscribe();
    })
);

test(
    "remove belonging",
    fakeSchedulers(advance => {
        const updatedBelongingsViewData = [
            {
                address: "Lamar St, Arvada, CO",
                batteryBarLevel: "90%",
                batteryLevelRange: "High",
                uid: "randomUUID01",
                name: "Keys",
                safeStatus: "InRange"
            },
            {
                address: "Everett St, Arvada, CO",
                batteryBarLevel: "30%",
                batteryLevelRange: "Medium",
                uid: "randomUUID03",
                name: "Wallet",
                safeStatus: "Unsafe",
                lastSeen: {
                    count: 1,
                    type: "Interval",
                    unit: "Minute"
                }
            }
        ];

        expect.assertions(3);
        viewModel.showBelongings.pipe(take(1)).subscribe(
            currentBelongings => {
                expect(currentBelongings).toMatchObject(
                    updatedBelongingsViewData
                );
                if (currentBelongings[0].lastSeen.type === "Date") {
                    expect(currentBelongings[0].lastSeen.date.getSeconds).toBe(
                        belonging01LastSeenChange.getSeconds
                    );
                }
            },
            e => console.error(e)
        );
        viewModel.showEmptyDashboard.pipe(take(1)).subscribe(
            shouldShow => expect(shouldShow).toBe(false),
            e => console.error(e)
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );
        showOnDashboardSubject.next(
            new ObjectCollectionUpdate({
                removed: [
                    {
                        index: 2
                    }
                ]
            })
        );

        advance(1);
        jest.useRealTimers();
    })
);
