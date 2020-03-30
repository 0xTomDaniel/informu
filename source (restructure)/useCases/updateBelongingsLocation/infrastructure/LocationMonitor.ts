import LocationMonitorPort, {
    Location as PortLocation
} from "../LocationMonitorPort";
import { fromEventPattern, defer } from "rxjs";
import { finalize, publishReplay, refCount, concatMap } from "rxjs/operators";
import Logger from "../../../shared/metaLanguage/Logger";

export enum GeoLocationEvent {
    Authorization = "authorization",
    Error = "error",
    Location = "location"
}

export enum GeoLocationAccuracy {
    High,
    Medium,
    Low,
    Passive
}

export interface GeoLocationOptions {
    desiredAccuracy?: GeoLocationAccuracy;
    distanceFilter?: number;
    interval?: number;
    notificationText?: string;
    notificationTitle?: string;
    stopOnTerminate?: boolean;
    startOnBoot?: boolean;
    stationaryRadius?: number;
    foo: string;
}

export enum AuthorizationStatus {
    NotAuthorized,
    Authorized,
    ForegroundOnly
}

export interface Subscription {
    remove(): void;
}

export interface GeoLocation {
    configure(options: GeoLocationOptions): Promise<void>;
    on(
        event: GeoLocationEvent.Authorization,
        callback: (status: AuthorizationStatus) => void
    ): Subscription;
    on(
        event: GeoLocationEvent.Error,
        callback: (error: Error) => void
    ): Subscription;
    on(
        event: GeoLocationEvent.Location,
        callback: (location: PortLocation) => void
    ): Subscription;
    start(): void;
    stop(): void;
}

export interface Geocoder {
    reverseGeocode(latitude: number, longitude: number): Promise<string>;
}

export default class LocationMonitor implements LocationMonitorPort {
    private readonly geocoder: Geocoder;
    private readonly geoLocation: GeoLocation;
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
        handler => this.geoLocation.on(GeoLocationEvent.Location, handler),
        (handler, subscription) => subscription.remove()
    );

    constructor(geocoder: Geocoder, geoLocation: GeoLocation) {
        this.geocoder = geocoder;
        this.geoLocation = geoLocation;
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
