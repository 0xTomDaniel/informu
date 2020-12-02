import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { AddMuTagInteractor, NewMuTagNotFound } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";
import { take, skip } from "rxjs/operators";
import EventTracker from "../../../shared/metaLanguage/EventTracker";
import Logger from "../../../shared/metaLanguage/Logger";
import UserError from "../../../shared/metaLanguage/UserError";

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
    popToTop: jest.fn<void, []>()
};
const NavigationPortMock = jest.fn<NavigationPort<Routes>, any>(
    (): NavigationPort<Routes> => ({
        routes: Object.assign({}, ...routes.map(v => ({ [v]: v }))),
        navigateTo: navigationPortMocks.navigateTo,
        popToTop: navigationPortMocks.popToTop
    })
);
const navigationPortMock = new NavigationPortMock();

let findNewMuTagFailure: UserError | undefined;
let setMuTagNameFailure: UserError | undefined;
const addMuTagInteractorMocks = {
    addFoundMuTag: jest.fn(() => Promise.resolve()),
    findNewMuTag: jest.fn(() =>
        findNewMuTagFailure == null
            ? Promise.resolve()
            : Promise.reject(findNewMuTagFailure)
    ),
    setMuTagName: jest.fn<Promise<void>, [string]>(() =>
        setMuTagNameFailure == null
            ? Promise.resolve()
            : Promise.reject(setMuTagNameFailure)
    ),
    stopFindingNewMuTag: jest.fn<void, []>()
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

afterEach(() => {
    jest.clearAllMocks();
    findNewMuTagFailure = undefined;
    viewModel = new AddMuTagViewModel(
        navigationPortMock,
        addMuTagInteractorMock
    );
});

test("Successfully navigate to Find Mu Tag screen.", async () => {
    expect.assertions(2);
    viewModel.goToFindMuTag();
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.FindMuTag
    );
});

test("Successfully start adding Mu tag.", async () => {
    expect.assertions(8);
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise();
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise();
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
    viewModel.startAddingMuTag();
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.NameMuTag
    );
});

test("Fails to start adding Mu tag.", async () => {
    expect.assertions(6);
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise();
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise();
    const showFailurePromise = viewModel.showFailure
        .pipe(skip(1), take(1))
        .toPromise();
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
    findNewMuTagFailure = UserError.create(NewMuTagNotFound);
    viewModel.startAddingMuTag();
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(1);
    await expect(showActivityPromise02).resolves.toBe(false);
    const findNewMuTagFailureMessage = AddMuTagViewModel.createUserMessage(
        findNewMuTagFailure.message,
        findNewMuTagFailure.originatingError
    );
    await expect(showFailurePromise).resolves.toStrictEqual(
        findNewMuTagFailureMessage
    );
});

test("Successfully retry start adding Mu tag.", async () => {
    expect.assertions(7);
    const showFailurePromise01 = viewModel.showFailure
        .pipe(skip(1), take(1))
        .toPromise();
    findNewMuTagFailure = UserError.create(NewMuTagNotFound);
    viewModel.startAddingMuTag();
    const findNewMuTagFailureMessage = AddMuTagViewModel.createUserMessage(
        findNewMuTagFailure.message,
        findNewMuTagFailure.originatingError
    );
    await expect(showFailurePromise01).resolves.toStrictEqual(
        findNewMuTagFailureMessage
    );
    findNewMuTagFailure = undefined;
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise();
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise();
    const showFailurePromise02 = viewModel.showFailure
        .pipe(skip(1), take(1))
        .toPromise();
    viewModel.startAddingMuTag(true);
    await expect(showFailurePromise02).resolves.toBeUndefined();
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.findNewMuTag).toHaveBeenCalledTimes(2);
    expect(addMuTagInteractorMocks.addFoundMuTag).toHaveBeenCalledTimes(1);
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
});

test("Successfully name Mu tag.", async () => {
    expect.assertions(8);
    const showActivityPromise01 = viewModel.showActivity
        .pipe(skip(1), take(1))
        .toPromise();
    const showActivityPromise02 = viewModel.showActivity
        .pipe(skip(2), take(1))
        .toPromise();
    expect(viewModel.showActivity.value).toBe(false);
    expect(viewModel.showFailure.value).toBeUndefined();
    expect(viewModel.showSuccess.value).toBeUndefined();
    const muTagName = "Keys";
    viewModel.setMuTagName(muTagName);
    await expect(showActivityPromise01).resolves.toBe(true);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledTimes(1);
    expect(addMuTagInteractorMocks.setMuTagName).toHaveBeenCalledWith(
        muTagName
    );
    await expect(showActivityPromise02).resolves.toBe(false);
    expect(navigationPortMocks.popToTop).toHaveBeenCalledTimes(1);
});

test("Fails to name Mu tag.", async () => {
    expect.assertions(8);
});
