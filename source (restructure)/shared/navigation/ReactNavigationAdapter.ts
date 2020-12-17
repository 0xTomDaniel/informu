import NavigationPort from "./NavigationPort";
import {
    NavigationContainerComponent,
    NavigationActions,
    StackActions
} from "react-navigation";
import { BackHandler } from "react-native";
import { Observable } from "rxjs";

export default class ReactNavigationAdapter<R extends string>
    implements NavigationPort<R> {
    readonly routes: { [K in R]: K };

    constructor(routes: readonly R[], backHandler: BackHandler) {
        this.backHandler = backHandler;
        this.routes = Object.assign({}, ...routes.map(v => ({ [v]: v })));
    }

    navigateTo(route: R): void {
        this.navigator?.dispatch(
            NavigationActions.navigate({
                routeName: route
            })
        );
    }

    onHardwareBackPress(override: boolean): Observable<void> {
        return new Observable(subscriber => {
            const subscription = this.backHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    subscriber.next();
                    return override;
                }
            );
            const teardown = () => subscription.remove();
            return teardown;
        });
    }

    popToTop(): void {
        this.navigator?.dispatch(StackActions.popToTop());
    }

    setNavigator(navigator: NavigationContainerComponent): void {
        this.navigator = navigator;
    }

    private readonly backHandler: BackHandler;
    private navigator: NavigationContainerComponent | undefined;
}
