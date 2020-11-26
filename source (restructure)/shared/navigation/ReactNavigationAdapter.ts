import NavigationPort from "./NavigationPort";
import {
    NavigationContainerComponent,
    NavigationActions,
    StackActions
} from "react-navigation";

export default class ReactNavigationAdapter<R extends string>
    implements NavigationPort<R> {
    routes: { [K in R]: K };

    constructor(routes: readonly R[], navigator: NavigationContainerComponent) {
        this.navigator = navigator;
        this.routes = Object.assign({}, ...routes.map(v => ({ [v]: v })));
    }

    navigateTo(route: R): void {
        this.navigator.dispatch(
            NavigationActions.navigate({
                routeName: route
            })
        );
    }

    popToTop(): void {
        this.navigator.dispatch(StackActions.popToTop());
    }

    private navigator: NavigationContainerComponent;
}
