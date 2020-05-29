import UpdateBelongingsLocationMonitorPort, {
    Location as PortLocation,
    Address
} from "../../useCases/updateBelongingsLocation/LocationMonitorPort";
import { fromEventPattern, defer } from "rxjs";
import { finalize, publishReplay, refCount, concatMap } from "rxjs/operators";
import Logger from "../metaLanguage/Logger";
import AdjustGeolocationLocationMonitorPort from "../../useCases/adjustGeolocation/LocationMonitorPort";

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
        callback: (location: PortLocation) => void
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

export default class LocationMonitor
    implements
        UpdateBelongingsLocationMonitorPort,
        AdjustGeolocationLocationMonitorPort {
    private readonly geocoder: Geocoder;
    private readonly geoLocation: Geolocation;
    private geoLocationStarted = false;
    readonly location = defer(() => {
        this.startGeoLocation();
        return this.locationUpdate;
    }).pipe(
        concatMap(location => this.locationWithAddress(location)),
        finalize(() => {
            this.stopGeoLocation();
        }),
        publishReplay(1),
        refCount()
    );
    private readonly locationUpdate = fromEventPattern<PortLocation>(
        handler => this.geoLocation.on(GeolocationEvent.Location, handler),
        (handler, subscription) => subscription.remove()
    );

    constructor(geocoder: Geocoder, geoLocation: Geolocation) {
        this.geocoder = geocoder;
        this.geoLocation = geoLocation;
    }

    async configure(options: GeolocationOptions): Promise<void> {
        await this.geoLocation.configure(options);
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

    private async locationWithAddress(
        location: PortLocation
    ): Promise<PortLocation> {
        //DEBUG
        console.warn(
            `locationWithAddress(location: ${JSON.stringify(location)})`
        );

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
}
