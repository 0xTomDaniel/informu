import ReactNavigationAdapter from "./ReactNavigationAdapter";
import {
    NavigationContainerComponent,
    NavigationAction,
    NavigationActions,
    StackActions
} from "react-navigation";
import { BackHandler, NativeEventSubscription } from "react-native";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";

const routes = ["Home", "Map", "Settings"] as const;
const eventListenerHandler = new Subject<() => void>();
const onRemove = new Subject<void>();
const backHandlerMocks = {
    exitApp: jest.fn(),
    addEventListener: (eventName: "hardwareBackPress", handler: () => void) => {
        eventListenerHandler.next(handler);
        const subscription: NativeEventSubscription = {
            remove: () => {
                onRemove.next();
            }
        };
        return subscription;
    },
    removeEventListener: jest.fn<void, ["hardwareBackPress", () => void]>()
};
const BackHandlerMock = jest.fn<BackHandler, any>(
    (): BackHandler => ({
        exitApp: backHandlerMocks.exitApp,
        addEventListener: backHandlerMocks.addEventListener,
        removeEventListener: backHandlerMocks.removeEventListener
    })
);
const backHandlerMock = new BackHandlerMock();
const reactNavigationAdapter = new ReactNavigationAdapter(
    routes,
    backHandlerMock
);

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

test("Override hardware back press.", async () => {
    expect.assertions(3);
    const override = true;
    const backPressSubject = new Subject<void>();
    const backPressPromise = backPressSubject.pipe(take(1)).toPromise();
    const handlerPromise = eventListenerHandler.pipe(take(1)).toPromise();
    const subscription = reactNavigationAdapter
        .onHardwareBackPress(override)
        .subscribe(backPressSubject);
    const handler = await handlerPromise;
    expect(handler()).toBe(override);
    await expect(backPressPromise).resolves.toBeUndefined();
    const removePromise = onRemove.pipe(take(1)).toPromise();
    subscription.unsubscribe();
    await expect(removePromise).resolves.toBeUndefined();
});
