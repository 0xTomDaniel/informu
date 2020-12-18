import { NavigationContainerComponent } from "react-navigation";
import { Observable } from "rxjs";

export default interface NavigationPort<R extends string> {
    routes: { [K in R]: K };
    navigateTo(route: R): void;
    onHardwareBackPress(override: boolean): Observable<void>;
    popToTop(): void;
    setNavigator(navigator: NavigationContainerComponent): void;
}
