import { Observable } from "rxjs";

export interface Location {
    address?: string;
    latitude: number;
    longitude: number;
}

export default interface LocationMonitorPort {
    location: Observable<Location>;
}
