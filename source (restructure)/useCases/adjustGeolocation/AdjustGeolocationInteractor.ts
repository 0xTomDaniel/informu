import AppStateMonitorPort from "./AppStateMonitorPort";
import {
    GeolocationAccuracy,
    GeolocationOptions,
    LocationProvider,
    LocationMonitorPort
} from "../../shared/geolocation/LocationMonitor";
import Logger from "../../shared/metaLanguage/Logger";

export default class AdjustGeolocationInteractor {
    constructor(
        appStateMonitor: AppStateMonitorPort,
        locationMonitor: LocationMonitorPort
    ) {
        this.appStateMonitor = appStateMonitor;
        this.locationMonitor = locationMonitor;
        this.start();
    }

    private readonly appStateMonitor: AppStateMonitorPort;
    private readonly locationMonitor: LocationMonitorPort;
    private readonly logger = Logger.instance;

    private start(): void {
        this.appStateMonitor.didEnterBackground.subscribe(
            () =>
                this.locationMonitor.configure(
                    This.backgroundLocationConfiguration
                ),
            e => this.logger.error(e)
        );
        this.appStateMonitor.didEnterForeground.subscribe(
            () => {
                this.locationMonitor.configure(
                    This.foregroundLocationConfiguration
                );
            },
            e => this.logger.error(e)
        );
    }

    private static readonly backgroundLocationConfiguration: GeolocationOptions = {
        activitiesInterval: 10000,
        desiredAccuracy: GeolocationAccuracy.Medium,
        fastestInterval: 5000,
        interval: 20000,
        locationProvider: LocationProvider.Activity
    };
    private static readonly foregroundLocationConfiguration: GeolocationOptions = {
        activitiesInterval: 1000,
        desiredAccuracy: GeolocationAccuracy.High,
        fastestInterval: 1000,
        interval: 2000,
        locationProvider: LocationProvider.Activity
    };
}

const This = AdjustGeolocationInteractor;
