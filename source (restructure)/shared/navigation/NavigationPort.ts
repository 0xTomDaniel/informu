import { NavigationContainerComponent } from "react-navigation";

export default interface NavigationPort<R extends string> {
    routes: { [K in R]: K };
    navigateTo(route: R): void;
    popToTop(): void;
    setNavigator(navigator: NavigationContainerComponent): void;
}
