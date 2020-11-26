import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { AddMuTagInteractor } from "../AddMuTagInteractor";
import NavigationPort from "../../../shared/navigation/NavigationPort";

/*const addMuTagRoutes = ["FindMuTag"] as const;
const foobar = ["Foo", "Bar"] as const;
const routes = [...addMuTagRoutes, ...foobar];
type Routes = typeof routes[number];*/

const routes = ["FindMuTag"] as const;
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

const addMuTagInteractorMocks = {
    addFoundMuTag: jest.fn<Promise<void>, []>(),
    findNewMuTag: jest.fn<Promise<void>, []>(),
    setMuTagName: jest.fn<Promise<void>, [string]>(),
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

const viewModel = new AddMuTagViewModel(
    navigationPortMock,
    addMuTagInteractorMock
);

test("Navigate to Find Mu Tag screen.", async () => {
    expect.assertions(2);
    viewModel.goToFindMuTag();
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledTimes(1);
    expect(navigationPortMocks.navigateTo).toHaveBeenCalledWith(
        navigationPortMock.routes.FindMuTag
    );
});

test("Start adding Mu tag.", async () => {
    expect.assertions(2);
});
