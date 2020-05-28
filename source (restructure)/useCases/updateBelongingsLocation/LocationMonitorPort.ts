import { Observable } from "rxjs";
import { GeolocationOptions } from "../../shared/geolocation/LocationMonitor";

export interface Address {
    formattedAddress: string;
    route: string;
    locality: string;
    administrativeAreaLevel1: string;
}

export interface Location {
    accuracy?: number;
    address?: Address;
    altitude?: number;
    bearing?: number;
    latitude: number;
    longitude: number;
    speed?: number;
    time: number;
}

export default interface LocationMonitorPort {
    location: Observable<Location>;
    configure(options: GeolocationOptions): Promise<void>;
}
