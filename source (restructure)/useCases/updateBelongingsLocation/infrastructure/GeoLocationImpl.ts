import {
    GeoLocation,
    GeoLocationEvent,
    GeoLocationOptions
} from "./LocationMonitor";
import BackgroundGeolocation, {
    EventSubscription
} from "@mauron85/react-native-background-geolocation";

export default class GeoLocationImpl implements GeoLocation {
    /*private _lastLocation?: Location;

    get lastLocation(): Location | undefined {
        return this._lastLocation;
    }*/

    on(
        event: GeoLocationEvent,
        callback: (param: any) => void
    ): EventSubscription {
        switch (event) {
            case GeoLocationEvent.Authorization:
                return BackgroundGeolocation.on(event, callback);
            //break;
            case GeoLocationEvent.Error:
                return BackgroundGeolocation.on(event, callback);
            //break;
            case GeoLocationEvent.Location:
                return BackgroundGeolocation.on(event, callback);
            //break;
        }
    }

    async configure(options: GeoLocationOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const successCallback = (): void => resolve();
            const failCallback = (): void =>
                reject(Error("Failed to configure BackgroundGeolocation."));
            BackgroundGeolocation.configure(
                options,
                successCallback,
                failCallback
            );
        });
    }

    start(): void {
        BackgroundGeolocation.start();
    }

    stop(): void {
        BackgroundGeolocation.stop();
    }
}
