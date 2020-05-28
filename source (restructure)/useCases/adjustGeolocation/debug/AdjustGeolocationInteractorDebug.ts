import LocationMonitorPort from "../LocationMonitorPort";
import {
    GeolocationOptions,
    GeolocationAccuracy,
    LocationProvider
} from "../../../shared/geolocation/LocationMonitor";
import Logger from "../../../shared/metaLanguage/Logger";

export default class AdjustGeolocationInteractorDebug {
    readonly defaultGeolocationOptions: GeolocationOptions = {
        activitiesInterval: 10000,
        desiredAccuracy: GeolocationAccuracy.Medium,
        fastestInterval: 5000,
        interval: 10000,
        locationProvider: LocationProvider.Activity
    };
    private readonly locationMonitor: LocationMonitorPort;
    private readonly logger = Logger.instance;

    constructor(locationMonitor: LocationMonitorPort) {
        this.locationMonitor = locationMonitor;
        this.start();
    }

    configureGeolocation(options: GeolocationOptions): void {
        console.warn(
            `configureGeolocation(options: ${JSON.stringify(options)})`
        );
        this.locationMonitor.configure(options);
    }

    private start(): void {
        this.locationMonitor.configure(this.defaultGeolocationOptions);
    }
}
