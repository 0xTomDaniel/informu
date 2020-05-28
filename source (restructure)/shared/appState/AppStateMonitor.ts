import AppStateMonitorPort from "../../useCases/adjustGeolocation/AppStateMonitorPort";
import { fromEventPattern } from "rxjs";
import { AppState, AppStateStatus } from "react-native";
import { filter, mapTo, tap } from "rxjs/operators";

export default class AppStateMonitor implements AppStateMonitorPort {
    private readonly appState = fromEventPattern<AppStateStatus>(
        handler => AppState.addEventListener("change", handler),
        handler => AppState.removeEventListener("change", handler)
    ).pipe(
        //DEBUG
        tap(
            change => console.warn(`change: ${JSON.stringify(change)}`),
            e => console.error(e),
            () => console.warn("AppState Observable Completed")
        )
    );
    readonly didEnterBackground = this.appState.pipe(
        filter(status => status === "background" || status === "inactive"),
        mapTo(undefined)
    );
    readonly didEnterForeground = this.appState.pipe(
        filter(status => status === "active"),
        mapTo(undefined)
    );
}
