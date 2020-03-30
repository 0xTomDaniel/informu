import LocationMonitorPort, {
    Location as PortLocation
} from "../LocationMonitorPort";
import { fromEventPattern, defer } from "rxjs";
import { finalize, publishReplay, refCount } from "rxjs/operators";

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

export default class LocationMonitor implements LocationMonitorPort {
    private readonly locationUpdate = fromEventPattern<PortLocation>(
        handler => this.geoLocation.on(GeoLocationEvent.Location, handler),
        (handler, subscription) => subscription.remove()
    );
    private readonly geoLocation: GeoLocation;
    private geoLocationStarted = false;
    readonly location = defer(() => {
        this.startGeoLocation();
        return this.locationUpdate;
    }).pipe(
        finalize(() => {
            this.stopGeoLocation();
        }),
        publishReplay(1),
        refCount()
    );

    constructor(geoLocation: GeoLocation) {
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
}
