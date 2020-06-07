import AdjustGeolocationInteractor from "./AdjustGeolocationInteractor";
import LocationMonitorPort from "./LocationMonitorPort";
import LocationMonitor, {
    GeolocationAccuracy,
    GeolocationOptions,
    Geolocation,
    Geocoder,
    LocationProvider
} from "../../shared/geolocation/LocationMonitor";
import { Subject } from "rxjs";
import AppStateMonitorPort from "./AppStateMonitorPort";
import { take } from "rxjs/operators";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

describe("Geolocation tracking adjusts automatically", (): void => {
    const didEnterBackgroundSubject = new Subject<void>();
    const didEnterForegroundSubject = new Subject<void>();
    const AppStateMonitorMock = jest.fn<AppStateMonitorPort, any>(
        (): AppStateMonitorPort => ({
            didEnterBackground: didEnterBackgroundSubject,
            didEnterForeground: didEnterForegroundSubject
        })
    );
    const appStateMonitor = AppStateMonitorMock();
    const LocationMonitorMock = jest.fn<LocationMonitorPort, any>(
        (): LocationMonitorPort => ({
            configure: jest.fn()
        })
    );
    const locationMonitorMock = LocationMonitorMock();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const adjustGeolocationInteractorCore = new AdjustGeolocationInteractor(
        appStateMonitor,
        locationMonitorMock
    );
    const GeocoderMock = jest.fn<Geocoder, any>(
        (): Geocoder => ({
            reverseGeocode: jest.fn()
        })
    );
    const geocoderMock = new GeocoderMock();
    const GeolocationMock = jest.fn<Geolocation, any>(
        (): Geolocation => ({
            configure: jest.fn(),
            on: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        })
    );
    const geolocationMock = new GeolocationMock();
    const locationMonitor = new LocationMonitor(geocoderMock, geolocationMock);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const adjustGeolocationInteractorFunctional = new AdjustGeolocationInteractor(
        appStateMonitor,
        locationMonitor
    );

    describe("Scenario 1: App moves into foreground", (): void => {
        // Given that the app is in background

        // When the app moves into foreground
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    didEnterForegroundSubject.pipe(take(1)).subscribe(
                        undefined,
                        e => console.error(e),
                        () => resolve()
                    );
                    didEnterForegroundSubject.next();
                });
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should increase geolocation to highest reasonable accuracy", (): void => {
            // Core
            expect(locationMonitorMock.configure).toHaveBeenCalledTimes(1);
            const options: GeolocationOptions = {
                activitiesInterval: 1000,
                desiredAccuracy: GeolocationAccuracy.High,
                fastestInterval: 1000,
                interval: 2000,
                locationProvider: LocationProvider.Activity
            };
            expect(locationMonitorMock.configure).toHaveBeenLastCalledWith(
                options
            );

            // Functional
            expect(geolocationMock.configure).toHaveBeenCalledTimes(1);
            expect(geolocationMock.configure).toHaveBeenLastCalledWith(options);
        });
    });

    describe("Scenario 1: App moves into background", (): void => {
        // Given that the app is in foreground

        // When the app moves into background
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise(resolve => {
                    didEnterBackgroundSubject.pipe(take(1)).subscribe(
                        undefined,
                        e => console.error(e),
                        () => resolve()
                    );
                    didEnterBackgroundSubject.next();
                });
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should decrease geolocation to lowest reasonable accuracy", (): void => {
            // Core
            expect(locationMonitorMock.configure).toHaveBeenCalledTimes(1);
            const options: GeolocationOptions = {
                activitiesInterval: 10000,
                desiredAccuracy: GeolocationAccuracy.Medium,
                fastestInterval: 5000,
                interval: 20000,
                locationProvider: LocationProvider.Activity
            };
            expect(locationMonitorMock.configure).toHaveBeenLastCalledWith(
                options
            );

            // Functional
            expect(geolocationMock.configure).toHaveBeenCalledTimes(1);
            expect(geolocationMock.configure).toHaveBeenLastCalledWith(options);
        });
    });
});
