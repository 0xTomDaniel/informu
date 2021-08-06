import {
    Geolocation,
    GeolocationEvent,
    GeolocationOptions
} from "./LocationMonitor";
import BackgroundGeolocation, {
    EventSubscription,
    Location
} from "@darron1217/react-native-background-geolocation";

export default class GeolocationImpl implements Geolocation {
    on(
        event: GeolocationEvent,
        callback: (param: any) => void
    ): EventSubscription {
        switch (event) {
            case GeolocationEvent.Authorization:
                return BackgroundGeolocation.on(event, callback);
            //break;
            case GeolocationEvent.Error:
                return BackgroundGeolocation.on(event, callback);
            //break;
            case GeolocationEvent.Location:
                return BackgroundGeolocation.on(event, callback);
            //break;
        }
    }

    async configure(options: GeolocationOptions): Promise<void> {
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

    async getLocations(): Promise<Location[]> {
        return new Promise((resolve, reject) => {
            const successCallback = (locations: Location[]): void =>
                resolve(locations);
            const failCallback = (): void =>
                reject(Error("Failed to configure BackgroundGeolocation."));
            BackgroundGeolocation.getLocations(successCallback, failCallback);
        });
    }

    async start(): Promise<void> {
        BackgroundGeolocation.start();

        await new Promise((resolve, reject) => {
            BackgroundGeolocation.checkStatus(
                status => {
                    const errorMessages: string[] = [];
                    if (status.authorization !== 1) {
                        switch (status.authorization) {
                            case 0:
                                errorMessages.push(
                                    "Geolocation not authorized."
                                );
                                break;
                            case 2:
                                errorMessages.push(
                                    "Geolocation not authorized for background tracking."
                                );
                                break;
                        }
                    }
                    if (!status.locationServicesEnabled) {
                        errorMessages.push("Location services are disabled.");
                    }
                    if (!status.isRunning) {
                        errorMessages.push("Geolocation could not be started.");
                    }
                    if (errorMessages.length === 0) {
                    } else {
                        const errorMessage = errorMessages.reduce(
                            (accumulator, currentValue, currentIndex) =>
                                currentIndex === 0
                                    ? currentValue
                                    : `${accumulator}; ${currentValue}`
                        );
                        reject(new Error(errorMessage));
                    }
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    stop(): void {
        BackgroundGeolocation.stop();
    }
}
