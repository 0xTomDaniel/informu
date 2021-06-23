import AddMuTagViewModel, { MediumPriorityMessage } from "./AddMuTagViewModel";
import AddMuTagInteractor, {
    AddMuTagInteractorException
} from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import { take, skip } from "rxjs/operators";
import EventTracker from "../../../shared/metaLanguage/EventTracker";
import Logger from "../../../shared/metaLanguage/Logger";
import {
    Subscription,
    Subscriber,
    Observable,
    EmptyError,
    BehaviorSubject,
    Subject
} from "rxjs";
import { NavigationContainerComponent } from "react-navigation";
import { ProgressIndicatorState } from "../../../shared/viewModel/ViewModel";

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

type Routes = typeof AddMuTagViewModel.routes[number];

const backPressSubscriber = new BehaviorSubject<Subscriber<void> | undefined>(
    undefined
);
const onBackPressUnsubscribe = new Subject<void>();
const navigationPortMocks = {
    navigateTo: jest.fn<void, [Routes]>(),
    onHardwareBackPress: jest.fn<Observable<void>, [boolean]>(
        () =>
            new Observable(subscriber => {
                backPressSubscriber.next(subscriber);
                const teardown = () => onBackPressUnsubscribe.next();
                return teardown;
            })
    ),
    popToTop: jest.fn<void, []>(),
    setNavigator: jest.fn<void, [NavigationContainerComponent]>()
};
const NavigationPortMock = jest.fn<NavigationPort<Routes>, any>(
    (): NavigationPort<Routes> => ({
        routes: Object.assign(
            {},
            ...AddMuTagViewModel.routes.map(v => ({ [v]: v }))
        ),
        navigateTo: navigationPortMocks.navigateTo,
        onHardwareBackPress: navigationPortMocks.onHardwareBackPress,
        popToTop: navigationPortMocks.popToTop,
        setNavigator: navigationPortMocks.setNavigator
    })
);
const navigationPortMock = new NavigationPortMock();

let findNewMuTagSubscriber: Subscriber<void>;
let findNewMuTagFailure: AddMuTagInteractorException | undefined;
let addNewMuTagFailure: AddMuTagInteractorException | undefined;
let setMuTagNameFailure: AddMuTagInteractorException | undefined;
const addMuTagInteractorMocks = {
    addFoundMuTag: jest.fn(() =>
        addNewMuTagFailure == null
            ? Promise.resolve()
            : Promise.reject(addNewMuTagFailure)
    ),
    findNewMuTag: jest.fn(() =>
        findNewMuTagFailure == null
            ? new Observable<void>(
                  subscriber => (findNewMuTagSubscriber = subscriber)
              ).toPromise()
            : Promise.reject(findNewMuTagFailure)
    ),
    setMuTagName: jest.fn<Promise<void>, [string]>(() =>
        setMuTagNameFailure == null
            ? Promise.resolve()
            : Promise.reject(setMuTagNameFailure)
    ),
    stopFindingNewMuTag: jest.fn(() => {
        findNewMuTagSubscriber.error(new EmptyError());
        return Promise.resolve();
    })
};
const AddMuTagInteractorMock = jest.fn<AddMuTagInteractor, any>(
    (): AddMuTagInteractor => ({
        addFoundMuTag: addMuTagInteractorMocks.addFoundMuTag,
        findNewMuTag: addMuTagInteractorMocks.findNewMuTag,
        setMuTagName: addMuTagInteractorMocks.setMuTagName,
        stopFindingNewMuTag: addMuTagInteractorMocks.stopFindingNewMuTag
    })
);
const addMuTagInteractorMock = new AddMuTagInteractorMock();

let viewModel = new AddMuTagViewModel(
    navigationPortMock,
    addMuTagInteractorMock
);

let emitCount = 0;
const getEmitCount = (): number => {
    const number = emitCount;
    emitCount++;
    return number;
};

afterEach(() => {
    jest.clearAllMocks();
    findNewMuTagFailure = undefined;
    addNewMuTagFailure = undefined;
    setMuTagNameFailure = undefined;
    emitCount = 0;
    viewModel = new AddMuTagViewModel(
        navigationPortMock,
        addMuTagInteractorMock
    );
});

test("Cancel add MuTag flow.", async () => {
    expect.assertions(2);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showCancel: new Map<number, boolean>(),
        showCancelActivity: new Map<number, boolean>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.progressIndicator.subscribe(state =>
            stateSequence.progressIndicator.set(getEmitCount(), state)
        )
    );
    subscriptions.push(
        viewModel.showCancel.subscribe(show =>
            stateSequence.showCancel.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showCancelActivity.subscribe(show =>
            stateSequence.showCancelActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(message =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), message)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    await viewModel.cancel();
    subscriptions.forEach(s => s.unsubscribe());
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [3, undefined],
            [8, undefined]
        ]),
        progressIndicator: new Map([
            [0, undefined],
            [6, undefined]
        ]),
        showCancel: new Map([
            [1, true],
            [7, true]
        ]),
        showCancelActivity: new Map([
            [2, false],
            [5, true],
            [10, false]
        ]),
        showRetry: new Map([
            [4, false],
            [9, false]
        ])
    });
});

test("Successfully navigate to Find MuTag screen.", async () => {
    expect.assertions(5);
    expect(navigationPortMocks.onHardwareBackPress).toHaveBeenCalledTimes(0);
    viewModel.goToFindMuTag();
    expect(navigationPortMocks.onHardwareBackPress).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.onHardwareBackPress).toBeCalledWith(true);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.FindAddMuTag
    );
});

test("Successfully start adding MuTag.", async () => {
    expect.assertions(12);
    expect(viewModel.progressIndicatorValue).toBe(undefined);
    expect(viewModel.showCancelValue).toBe(true);
    expect(viewModel.mediumPriorityMessageValue).toBeUndefined();
    const executionOrder: number[] = [];
    const progressIndicatorPromise01 = viewModel.progressIndicator
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    const showCancelPromise = viewModel.showCancel
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    const progressIndicatorPromise02 = viewModel.progressIndicator
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(2));
    viewModel.startAddingMuTag();
    await expect(progressIndicatorPromise01).resolves.toBe("Indeterminate");
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(0);
    findNewMuTagSubscriber.complete();
    await expect(showCancelPromise).resolves.toBe(false);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    await expect(progressIndicatorPromise02).resolves.toBe(undefined);
    expect(executionOrder).toStrictEqual([0, 1, 2]);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.NameMuTag
    );
});

test("Cancel start adding MuTag.", async () => {
    expect.assertions(4);
    viewModel.startAddingMuTag();
    await viewModel.cancel();
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.stopFindingNewMuTag).toHaveBeenCalledTimes(
        1
    );
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(0);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
});

test("Hardware back press cancels on find & add MuTag screen.", async () => {
    expect.assertions(2);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        onUnsubscribe: new Set<number>(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showCancel: new Map<number, boolean>(),
        showCancelActivity: new Map<number, boolean>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        onBackPressUnsubscribe.subscribe(() =>
            stateSequence.onUnsubscribe.add(getEmitCount())
        )
    );
    subscriptions.push(
        viewModel.progressIndicator.subscribe(state =>
            stateSequence.progressIndicator.set(getEmitCount(), state)
        )
    );
    subscriptions.push(
        viewModel.showCancel.subscribe(show =>
            stateSequence.showCancel.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showCancelActivity.subscribe(show =>
            stateSequence.showCancelActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(failure =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    viewModel.goToFindMuTag();
    backPressSubscriber.value?.next();
    subscriptions.forEach(s => s.unsubscribe());
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [3, undefined],
            [8, undefined]
        ]),
        onUnsubscribe: new Set([11]),
        progressIndicator: new Map([
            [0, undefined],
            [6, undefined]
        ]),
        showCancel: new Map([
            [1, true],
            [7, true]
        ]),
        showCancelActivity: new Map([
            [2, false],
            [5, true],
            [10, false]
        ]),
        showRetry: new Map([
            [4, false],
            [9, false]
        ])
    });
});

test("Fails to find new MuTag.", async () => {
    expect.assertions(1);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.progressIndicator.subscribe(show =>
            stateSequence.progressIndicator.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(failure =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    findNewMuTagFailure = AddMuTagInteractorException.NewMuTagNotFound(
        undefined
    );
    await viewModel.startAddingMuTag();
    subscriptions.forEach(s => s.unsubscribe());
    expect(stateSequence).toStrictEqual({
        progressIndicator: new Map([
            [0, undefined],
            [3, "Indeterminate"],
            [4, undefined]
        ]),
        mediumPriorityMessage: new Map([
            [1, undefined],
            [
                5,
                {
                    messageKey: "NewMuTagNotFound",
                    data: []
                }
            ]
        ]),
        showRetry: new Map([
            [2, false],
            [6, true]
        ])
    });
});

test("Fails to add new MuTag.", async () => {
    expect.assertions(1);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.progressIndicator.subscribe(show =>
            stateSequence.progressIndicator.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(failure =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    addNewMuTagFailure = AddMuTagInteractorException.FailedToAddMuTag(
        undefined
    );
    const startAddingPromise = viewModel.startAddingMuTag();
    findNewMuTagSubscriber.complete();
    await startAddingPromise;
    subscriptions.forEach(s => s.unsubscribe());
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [1, undefined],
            [
                5,
                {
                    messageKey: "FailedToAddMuTag",
                    data: []
                }
            ]
        ]),
        progressIndicator: new Map([
            [0, undefined],
            [3, "Indeterminate"],
            [4, undefined]
        ]),
        showRetry: new Map([
            [2, false],
            [6, true]
        ])
    });
});

test("Successfully retry start adding MuTag.", async () => {
    expect.assertions(3);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.progressIndicator.subscribe(show =>
            stateSequence.progressIndicator.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(failure =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    findNewMuTagFailure = AddMuTagInteractorException.NewMuTagNotFound(
        undefined
    );
    await viewModel.startAddingMuTag();
    findNewMuTagFailure = undefined;
    const startAddingPromise = viewModel.startAddingMuTag(true);
    findNewMuTagSubscriber.complete();
    await startAddingPromise;
    subscriptions.forEach(s => s.unsubscribe());
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(2);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [1, undefined],
            [
                5,
                {
                    messageKey: "NewMuTagNotFound",
                    data: []
                }
            ],
            [7, undefined]
        ]),
        progressIndicator: new Map([
            [0, undefined],
            [3, "Indeterminate"],
            [4, undefined],
            [8, "Indeterminate"],
            [9, undefined]
        ]),
        showRetry: new Map([
            [2, false],
            [6, true],
            [10, false]
        ])
    });
});

test("Successfully name MuTag.", async () => {
    expect.assertions(4);
    viewModel.goToFindMuTag();
    const addMuTagPromise = viewModel.startAddingMuTag();
    findNewMuTagSubscriber.complete();
    await addMuTagPromise;
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        onUnsubscribe: new Set<number>(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showCancel: new Map<number, boolean>(),
        showCancelActivity: new Map<number, boolean>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        onBackPressUnsubscribe.subscribe(() =>
            stateSequence.onUnsubscribe.add(getEmitCount())
        )
    );
    subscriptions.push(
        viewModel.progressIndicator.subscribe(show =>
            stateSequence.progressIndicator.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showCancel.subscribe(show =>
            stateSequence.showCancel.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showCancelActivity.subscribe(show =>
            stateSequence.showCancelActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(failure =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    const muTagName = "Keys";
    await viewModel.setMuTagName(muTagName);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
    subscriptions.forEach(s => s.unsubscribe());
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [3, undefined],
            [7, undefined]
        ]),
        onUnsubscribe: new Set([9]),
        progressIndicator: new Map([
            [0, undefined],
            [5, "Indeterminate"],
            [6, undefined]
        ]),
        showCancel: new Map([[1, false]]),
        showCancelActivity: new Map([[2, false]]),
        showRetry: new Map([
            [4, false],
            [8, false]
        ])
    });
});

test("Fails to name MuTag.", async () => {
    expect.assertions(4);
    const stateSequence = {
        mediumPriorityMessage: new Map<
            number,
            MediumPriorityMessage | undefined
        >(),
        progressIndicator: new Map<number, ProgressIndicatorState>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.progressIndicator.subscribe(show =>
            stateSequence.progressIndicator.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.mediumPriorityMessage.subscribe(message =>
            stateSequence.mediumPriorityMessage.set(getEmitCount(), message)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            stateSequence.showRetry.set(getEmitCount(), show)
        )
    );
    setMuTagNameFailure = AddMuTagInteractorException.FailedToNameMuTag(
        undefined
    );
    const muTagName = "Keys";
    await viewModel.setMuTagName(muTagName);
    subscriptions.forEach(s => s.unsubscribe());
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(0);
    expect(stateSequence).toStrictEqual({
        mediumPriorityMessage: new Map([
            [1, undefined],
            [
                5,
                {
                    messageKey: "FailedToNameMuTag",
                    data: []
                }
            ]
        ]),
        progressIndicator: new Map([
            [0, undefined],
            [3, "Indeterminate"],
            [4, undefined]
        ]),
        showRetry: new Map([
            [2, false],
            [6, true]
        ])
    });
});

test("Successfully retry to name MuTag.", async () => {
    expect.assertions(10);
    const executionOrder: number[] = [];
    const mediumPriorityMessagePromise01 = viewModel.mediumPriorityMessage
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    setMuTagNameFailure = AddMuTagInteractorException.FailedToNameMuTag(
        undefined
    );
    const muTagName = "Keys";
    viewModel.setMuTagName(muTagName);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    await expect(mediumPriorityMessagePromise01).resolves.toStrictEqual({
        messageKey: "FailedToNameMuTag",
        data: []
    });
    setMuTagNameFailure = undefined;
    const mediumPriorityMessagePromise02 = viewModel.mediumPriorityMessage
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    const progressIndicatorPromise01 = viewModel.progressIndicator
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(2));
    const progressIndicatorPromise02 = viewModel.progressIndicator
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(3));
    const showRetryPromise = viewModel.showRetry
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(4));
    viewModel.setMuTagName(muTagName, true);
    await expect(mediumPriorityMessagePromise02).resolves.toBeUndefined();
    await expect(progressIndicatorPromise01).resolves.toBe("Indeterminate");
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(2);
    await expect(showRetryPromise).resolves.toBe(false);
    await expect(progressIndicatorPromise02).resolves.toBe(undefined);
    expect(executionOrder).toStrictEqual([0, 1, 2, 3, 4]);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
});

test("Disable hardware back press on name MuTag screen.", async () => {
    expect.assertions(2);
    viewModel.goToFindMuTag();
    const addMuTagPromise = viewModel.startAddingMuTag();
    findNewMuTagSubscriber.complete();
    await addMuTagPromise;
    expect(backPressSubscriber.value).toBeDefined();
    backPressSubscriber.value?.next();
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(0);
});
