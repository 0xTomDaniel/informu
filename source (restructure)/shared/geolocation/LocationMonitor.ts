import { fromEventPattern, defer, Observable, merge, EMPTY, from } from "rxjs";
import {
    finalize,
    publishReplay,
    refCount,
    concatMap,
    map,
    filter
} from "rxjs/operators";
import Logger from "../metaLanguage/Logger";

export enum GeolocationEvent {
    Authorization = "authorization",
    Error = "error",
    Location = "location"
}

export enum GeolocationAccuracy {
    High,
    Medium,
    Low,
    Passive
}

export enum LocationProvider {
    DistanceFilter,
    Activity,
    Raw
}

export interface GeolocationOptions {
    activitiesInterval?: number;
    desiredAccuracy?: GeolocationAccuracy;
    distanceFilter?: number;
    fastestInterval?: number;
    interval?: number;
    locationProvider?: LocationProvider;
    notificationIconColor?: string;
    notificationIconLarge?: string;
    notificationIconSmall?: string;
    notificationText?: string;
    notificationTitle?: string;
    stopOnTerminate?: boolean;
    startForeground?: boolean;
    startOnBoot?: boolean;
    stationaryRadius?: number;
}

export enum AuthorizationStatus {
    NotAuthorized,
    Authorized,
    ForegroundOnly
}

export interface Subscription {
    remove(): void;
}

export interface Geolocation {
    configure(options: GeolocationOptions): Promise<void>;
    getLocations(): Promise<Location[]>;
    on(
        event: GeolocationEvent.Authorization,
        callback: (status: AuthorizationStatus) => void
    ): Subscription;
    on(
        event: GeolocationEvent.Error,
        callback: (error: Error) => void
    ): Subscription;
    on(
        event: GeolocationEvent.Location,
        callback: (location: Location) => void
    ): Subscription;
    start(): Promise<void>;
    stop(): void;
}

export interface Geocoder {
    reverseGeocode(
        latitude: number,
        longitude: number
    ): Promise<Address | undefined>;
}

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

export interface LocationMonitorPort {
    readonly location: Observable<Location>;
    configure(options: GeolocationOptions): Promise<void>;
}

export default class LocationMonitor implements LocationMonitorPort {
    readonly location: Observable<Location>;

    constructor(geocoder: Geocoder, geoLocation: Geolocation) {
        this.geocoder = geocoder;
        this.geoLocation = geoLocation;
        this.location = merge(
            from(this.geoLocation.getLocations()).pipe(
                map(locations => locations.pop()),
                filter((location): location is Location => location != null)
            ),
            this.locationUpdate,
            defer(() => {
                this.startGeoLocation();
                return EMPTY;
            })
        ).pipe(
            concatMap(location => this.locationWithAddress(location)),
            finalize(() => {
                this.stopGeoLocation();
            }),
            publishReplay(1),
            refCount()
        );
    }

    async configure(options: GeolocationOptions): Promise<void> {
        await this.geoLocation.configure(options);
    }

    private readonly geocoder: Geocoder;
    private readonly geoLocation: Geolocation;
    private geoLocationStarted = false;

    private readonly locationUpdate = fromEventPattern<Location>(
        handler => this.geoLocation.on(GeolocationEvent.Location, handler),
        (_, subscription) => subscription.remove()
    );

    private async locationWithAddress(location: Location): Promise<Location> {
        const locationWithAddress = Object.assign({}, location);
        try {
            locationWithAddress.address = await this.geocoder.reverseGeocode(
                location.latitude,
                location.longitude
            );
        } catch (e) {
            Logger.instance.warn(e, true);
        }
        return locationWithAddress;
    }

    private startGeoLocation(): void {
        if (this.geoLocationStarted) {
            return;
        }
        this.geoLocation.start();
        this.geoLocationStarted = true;
    }

    private stopGeoLocation(): void {
        if (!this.geoLocationStarted) {
            return;
        }
        this.geoLocation.stop();
        this.geoLocationStarted = false;
    }
}
