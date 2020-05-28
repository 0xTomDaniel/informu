import LocationMonitorPort from "./LocationMonitorPort";
import AppStateMonitorPort from "./AppStateMonitorPort";
import {
    GeolocationAccuracy,
    GeolocationOptions,
    LocationProvider
} from "../../shared/geolocation/LocationMonitor";
import Logger from "../../shared/metaLanguage/Logger";

export default class AdjustGeolocationInteractor {
    private readonly appStateMonitor: AppStateMonitorPort;
    private readonly backgroundLocationConfiguration: GeolocationOptions = {
        activitiesInterval: 10000,
        desiredAccuracy: GeolocationAccuracy.Medium,
        fastestInterval: 5000,
        interval: 10000,
        locationProvider: LocationProvider.Activity
    };
    private readonly foregroundLocationConfiguration: GeolocationOptions = {
        activitiesInterval: 1000,
        desiredAccuracy: GeolocationAccuracy.High,
        fastestInterval: 1000,
        interval: 2000,
        locationProvider: LocationProvider.Activity
    };
    private readonly locationMonitor: LocationMonitorPort;
    private readonly logger = Logger.instance;

    constructor(
        appStateMonitor: AppStateMonitorPort,
        locationMonitor: LocationMonitorPort
    ) {
        this.appStateMonitor = appStateMonitor;
        this.locationMonitor = locationMonitor;
        this.start();
    }

    private start(): void {
        this.appStateMonitor.didEnterBackground.subscribe(
            () =>
                this.locationMonitor.configure(
                    this.backgroundLocationConfiguration
                ),
            e => this.logger.error(e)
        );
        this.appStateMonitor.didEnterForeground.subscribe(
            () => {
                this.locationMonitor.configure(
                    this.foregroundLocationConfiguration
                );
            },
            e => this.logger.error(e)
        );
    }
}
