import { Observable } from "rxjs";

export default interface AppStateMonitorPort {
    didEnterBackground: Observable<void>;
    didEnterForeground: Observable<void>;
}
