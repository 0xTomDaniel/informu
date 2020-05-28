import { GeolocationOptions } from "../../shared/geolocation/LocationMonitor";

export default interface LocationMonitorPort {
    configure(options: GeolocationOptions): Promise<void>;
}
