import ReactNavigationAdapter from "./ReactNavigationAdapter";
import {
    NavigationContainerComponent,
    NavigationAction,
    NavigationActions,
    StackActions
} from "react-navigation";

const routes = ["Home", "Map", "Settings"] as const;
const reactNavigationAdapter = new ReactNavigationAdapter(routes);

const navContainerComponentMocks = {
    dispatch: jest.fn<boolean, [NavigationAction]>()
};
const NavigationContainerComponentMock = jest.fn<
    NavigationContainerComponent,
    any
>(
    (): NavigationContainerComponent => ({
        dispatch: navContainerComponentMocks.dispatch,
        context: jest.fn(),
        setState: jest.fn(),
        forceUpdate: jest.fn(),
        render: jest.fn(),
        props: {},
        state: jest.fn(),
        refs: {}
    })
);
const navigationContainerComponentMock = new NavigationContainerComponentMock();

reactNavigationAdapter.setNavigator(navigationContainerComponentMock);

afterEach(() => {
    jest.resetAllMocks();
});

test("Navigate to Map route.", () => {
    expect.assertions(2);
    const route = reactNavigationAdapter.routes.Map;
    reactNavigationAdapter.navigateTo(route);
    expect(navContainerComponentMocks.dispatch).toBeCalledTimes(1);
    expect(navContainerComponentMocks.dispatch).toHaveBeenCalledWith(
        NavigationActions.navigate({
            routeName: route
        })
    );
});

test("Pop to the top route of the stack.", () => {
    expect.assertions(2);
    reactNavigationAdapter.popToTop();
    expect(navContainerComponentMocks.dispatch).toBeCalledTimes(1);
    expect(navContainerComponentMocks.dispatch).toHaveBeenCalledWith(
        StackActions.popToTop()
    );
});
