import AddMuTagViewModel from "./AddMuTagViewModel";
import AddMuTagInteractor, {
    NewMuTagNotFound,
    FailedToSaveSettings
} from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import { take, skip } from "rxjs/operators";
import EventTracker from "../../../shared/metaLanguage/EventTracker";
import Logger from "../../../shared/metaLanguage/Logger";
import UserError from "../../../shared/metaLanguage/UserError";
import UserWarning from "../../../shared/metaLanguage/UserWarning";
import { Subject, Subscription } from "rxjs";
import { NavigationContainerComponent } from "react-navigation";
import { ViewModelUserMessage } from "../../../shared/viewModel/ViewModel";

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

const otherRoutes = ["Home", "Settings"] as const;
const routes = [...AddMuTagViewModel.routes, ...otherRoutes];
type Routes = typeof routes[number];

const navigationPortMocks = {
    navigateTo: jest.fn<void, [Routes]>(),
    popToTop: jest.fn<void, []>(),
    setNavigator: jest.fn<void, [NavigationContainerComponent]>()
};
const NavigationPortMock = jest.fn<NavigationPort<Routes>, any>(
    (): NavigationPort<Routes> => ({
        routes: Object.assign({}, ...routes.map(v => ({ [v]: v }))),
        navigateTo: navigationPortMocks.navigateTo,
        popToTop: navigationPortMocks.popToTop,
        setNavigator: navigationPortMocks.setNavigator
    })
);
const navigationPortMock = new NavigationPortMock();

const resolveFindNewMuTag = new Subject<void>();
let findNewMuTagFailure: UserError | undefined;
let setMuTagNameFailure: UserWarning | undefined;
const addMuTagInteractorMocks = {
    addFoundMuTag: jest.fn(() => Promise.resolve()),
    findNewMuTag: jest.fn(() =>
        findNewMuTagFailure == null
            ? resolveFindNewMuTag.pipe(take(1)).toPromise()
            : Promise.reject(findNewMuTagFailure)
    ),
    setMuTagName: jest.fn<Promise<void>, [string]>(() =>
        setMuTagNameFailure == null
            ? Promise.resolve()
            : Promise.reject(setMuTagNameFailure)
    ),
    stopFindingNewMuTag: jest.fn(() => {
        resolveFindNewMuTag.next();
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
    setMuTagNameFailure = undefined;
    emitCount = 0;
    viewModel = new AddMuTagViewModel(
        navigationPortMock,
        addMuTagInteractorMock
    );
});

test("Cancel add Mu tag flow.", async () => {
    expect.assertions(5);
    expect(viewModel.showCancel.value).toBe(true);
    expect(viewModel.showCancelActivity.value).toBe(false);
    const onShowCancelActivity01 = viewModel.showCancelActivity
        .pipe(skip(1), take(1))
        .toPromise();
    const onShowCancelActivity02 = viewModel.showCancelActivity
        .pipe(skip(2), take(1))
        .toPromise();
    viewModel.cancel();
    await expect(onShowCancelActivity01).resolves.toBe(true);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
    await expect(onShowCancelActivity02).resolves.toBe(false);
});

test("Successfully navigate to Find Mu Tag screen.", async () => {
    expect.assertions(2);
    viewModel.goToFindMuTag();
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.FindAddMuTag
    );
});

test("Successfully start adding Mu tag.", async () => {
    expect.assertions(12);
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showCancel.value).toBe(true);
    expect(viewModel.showFailure.value).toBeUndefined();
    const executionOrder: number[] = [];
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    const showCancelPromise = viewModel.showCancel
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(2));
    viewModel.startAddingMuTag();
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(0);
    resolveFindNewMuTag.next();
    await expect(showCancelPromise).resolves.toBe(false);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(executionOrder).toStrictEqual([0, 1, 2]);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.NameMuTag
    );
});

test("Cancel start adding Mu tag.", async () => {
    expect.assertions(12);
    const executionOrder: number[] = [];
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    const showCancelActivityPromise01 = viewModel.showCancelActivity
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    const showCancelActivityPromise02 = viewModel.showCancelActivity
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(2));
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(3));
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showCancelActivity.value).toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
    viewModel.startAddingMuTag();
    await expect(showActivityPromise01).resolves.toBe(true);
    viewModel.cancel();
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.stopFindingNewMuTag).toHaveBeenCalledTimes(
        1
    );
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(0);
    await expect(showCancelActivityPromise01).resolves.toBe(true);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
    await expect(showCancelActivityPromise02).resolves.toBe(false);
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(executionOrder).toStrictEqual([0, 1, 2, 3]);
});

test("Fails to start adding Mu tag.", async () => {
    expect.assertions(1);
    const finalState = {
        showActivity: new Map<number, boolean>(),
        showFailure: new Map<number, ViewModelUserMessage | undefined>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.showActivity.subscribe(show =>
            finalState.showActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showFailure.subscribe(failure =>
            finalState.showFailure.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            finalState.showRetry.set(getEmitCount(), show)
        )
    );
    findNewMuTagFailure = UserError.create(NewMuTagNotFound);
    await viewModel.startAddingMuTag();
    subscriptions.forEach(s => s.unsubscribe());
    const findNewMuTagFailureMessage = AddMuTagViewModel.createUserMessage(
        findNewMuTagFailure.userFriendlyMessage,
        findNewMuTagFailure.message
    );
    expect(finalState).toStrictEqual({
        showActivity: new Map([
            [0, false],
            [3, true],
            [6, false]
        ]),
        showFailure: new Map([
            [1, undefined],
            [4, findNewMuTagFailureMessage]
        ]),
        showRetry: new Map([
            [2, false],
            [5, true]
        ])
    });
});

test("Successfully retry start adding Mu tag.", async () => {
    expect.assertions(3);
    const finalState = {
        showActivity: new Map<number, boolean>(),
        showFailure: new Map<number, ViewModelUserMessage | undefined>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.showActivity.subscribe(show =>
            finalState.showActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showFailure.subscribe(failure =>
            finalState.showFailure.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            finalState.showRetry.set(getEmitCount(), show)
        )
    );
    findNewMuTagFailure = UserError.create(NewMuTagNotFound);
    const findNewMuTagFailureMessage = AddMuTagViewModel.createUserMessage(
        findNewMuTagFailure.userFriendlyMessage,
        findNewMuTagFailure.message
    );
    await viewModel.startAddingMuTag();
    findNewMuTagFailure = undefined;
    const startAddingPromise = viewModel.startAddingMuTag(true);
    resolveFindNewMuTag.next();
    await startAddingPromise;
    subscriptions.forEach(s => s.unsubscribe());
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(2);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    expect(finalState).toStrictEqual({
        showActivity: new Map([
            [0, false],
            [3, true],
            [6, false],
            [8, true],
            [10, false]
        ]),
        showFailure: new Map([
            [1, undefined],
            [4, findNewMuTagFailureMessage],
            [7, undefined]
        ]),
        showRetry: new Map([
            [2, false],
            [5, true],
            [9, false]
        ])
    });
});

test("Successfully name Mu tag.", async () => {
    expect.assertions(9);
    viewModel.startAddingMuTag();
    resolveFindNewMuTag.next();
    await viewModel.showActivity.pipe(skip(1), take(1)).toPromise();
    const executionOrder: number[] = [];
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showCancel.value).toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
    const muTagName = "Keys";
    viewModel.setMuTagName(muTagName);
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(executionOrder).toStrictEqual([0, 1]);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
});

test("Fails to name Mu tag.", async () => {
    expect.assertions(4);
    const finalState = {
        showActivity: new Map<number, boolean>(),
        showFailure: new Map<number, ViewModelUserMessage | undefined>(),
        showRetry: new Map<number, boolean>()
    };
    const subscriptions: Subscription[] = [];
    subscriptions.push(
        viewModel.showActivity.subscribe(show =>
            finalState.showActivity.set(getEmitCount(), show)
        )
    );
    subscriptions.push(
        viewModel.showFailure.subscribe(failure =>
            finalState.showFailure.set(getEmitCount(), failure)
        )
    );
    subscriptions.push(
        viewModel.showRetry.subscribe(show =>
            finalState.showRetry.set(getEmitCount(), show)
        )
    );
    setMuTagNameFailure = UserWarning.create(FailedToSaveSettings);
    const muTagName = "Keys";
    await viewModel.setMuTagName(muTagName);
    subscriptions.forEach(s => s.unsubscribe());
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(0);
    const setMuTagNameFailureMessage = AddMuTagViewModel.createUserMessage(
        setMuTagNameFailure.message,
        setMuTagNameFailure.originatingError
    );
    expect(finalState).toStrictEqual({
        showActivity: new Map([
            [0, false],
            [3, true],
            [6, false]
        ]),
        showFailure: new Map([
            [1, undefined],
            [4, setMuTagNameFailureMessage]
        ]),
        showRetry: new Map([
            [2, false],
            [5, true]
        ])
    });
});

test("Successfully retry to name Mu tag.", async () => {
    expect.assertions(10);
    const executionOrder: number[] = [];
    const showFailurePromise01 = viewModel.showFailure
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(0));
    setMuTagNameFailure = UserWarning.create(FailedToSaveSettings);
    const muTagName = "Keys";
    viewModel.setMuTagName(muTagName);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    const setMuTagNameFailureMessage = AddMuTagViewModel.createUserMessage(
        setMuTagNameFailure.message,
        setMuTagNameFailure.originatingError
    );
    await expect(showFailurePromise01).resolves.toStrictEqual(
        setMuTagNameFailureMessage
    );
    setMuTagNameFailure = undefined;
    const showFailurePromise02 = viewModel.showFailure
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(1));
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(2));
    const showRetryPromise = viewModel.showRetry
        .pipe(skip(1), take(1))
        .toPromise()
        .finally(() => executionOrder.push(3));
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise()
        .finally(() => executionOrder.push(4));
    viewModel.setMuTagName(muTagName, true);
    await expect(showFailurePromise02).resolves.toBeUndefined();
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(2);
    await expect(showRetryPromise).resolves.toBe(false);
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(executionOrder).toStrictEqual([0, 1, 2, 3, 4]);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
});
