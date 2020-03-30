import { Observable } from "rxjs";

export interface Location {
    accuracy?: number;
    address?: string;
    altitude?: number;
    bearing?: number;
    latitude: number;
    longitude: number;
    speed?: number;
    time: number;
}

export default interface LocationMonitorPort {
    location: Observable<Location>;
}
