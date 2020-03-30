import LocationMonitor, {
    GeoLocation,
    GeoLocationEvent,
    Subscription as EventSubscription,
    Geocoder
} from "./LocationMonitor";
import { v4 as uuidV4 } from "uuid";
import { Location } from "../LocationMonitorPort";
import { take } from "rxjs/operators";

const GeocoderMock = jest.fn<Geocoder, any>(
    (): Geocoder => ({
        reverseGeocode: jest.fn()
    })
);
const geocoderMock = new GeocoderMock();
const GeoLocationMock = jest.fn<GeoLocation, any>(
    (): GeoLocation => ({
        configure: jest.fn(),
        on: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
    })
);
const geoLocationMock = new GeoLocationMock();
class SubscriptionImpl implements EventSubscription {
    private static readonly subscriptions = new Map<
        string,
        EventSubscription
    >();
    private callback?: (param: any) => void;
    private readonly uid = uuidV4();

    constructor(callback: (param: any) => void) {
        this.callback = callback;
    }

    triggerEvent(param: any): void {
        this.callback?.(param);
    }

    remove(): void {
        this.callback = undefined;
        SubscriptionImpl.subscriptions.delete(this.uid);
    }
}
let locationEventSubscription: SubscriptionImpl;
(geoLocationMock.on as jest.Mock).mockImplementation((event, callback) => {
    switch (event) {
        case GeoLocationEvent.Authorization:
            break;
        case GeoLocationEvent.Error:
            break;
        case GeoLocationEvent.Location: {
            locationEventSubscription = new SubscriptionImpl(callback);
            return locationEventSubscription;
        }
    }
});
const locationMonitor = new LocationMonitor(geocoderMock, geoLocationMock);

const firstLocationUpdate = {
    latitude: 39.836557861962184,
    longitude: -105.09686516468388,
    time: new Date().valueOf()
};
const firstLocationUpdateWithAddress = {
    address: "7722 Everett St., Arvada, CO 80005",
    latitude: firstLocationUpdate.latitude,
    longitude: firstLocationUpdate.longitude,
    time: firstLocationUpdate.time
};

it("receives location update", async (): Promise<void> => {
    (geocoderMock.reverseGeocode as jest.Mock).mockResolvedValueOnce(
        firstLocationUpdateWithAddress.address
    );
    expect.assertions(1);
    return new Promise(resolve => {
        locationMonitor.location
            .pipe(take(1))
            .subscribe((location: Location) => {
                expect(location).toEqual(firstLocationUpdateWithAddress);
                resolve();
            });
        locationEventSubscription.triggerEvent(firstLocationUpdate);
        locationEventSubscription.remove();
    });
});

it("multiple subscribers receive last location and location update", async (): Promise<
    void
> => {
    const secondLocationUpdate = {
        latitude: 39.91177778344706,
        longitude: -104.92854109499716,
        time: new Date().valueOf()
    };
    const secondLocationUpdateWithAddress = {
        address: "11894 Elm Drive, Thornton, CO 80233",
        latitude: secondLocationUpdate.latitude,
        longitude: secondLocationUpdate.longitude,
        time: secondLocationUpdate.time
    };
    (geocoderMock.reverseGeocode as jest.Mock).mockResolvedValueOnce(
        secondLocationUpdateWithAddress.address
    );
    expect.assertions(5);
    await new Promise(resolve => {
        let firstLocationCount = 0;
        locationMonitor.location
            .pipe(take(2))
            .subscribe((location: Location) => {
                firstLocationCount++;
                switch (firstLocationCount) {
                    case 1:
                        expect(location).toEqual(
                            firstLocationUpdateWithAddress
                        );
                        break;
                    case 2:
                        expect(location).toEqual(
                            secondLocationUpdateWithAddress
                        );
                }
            });
        let secondLocationCount = 0;
        locationMonitor.location
            .pipe(take(2))
            .subscribe((location: Location) => {
                secondLocationCount++;
                switch (secondLocationCount) {
                    case 1:
                        expect(location).toEqual(
                            firstLocationUpdateWithAddress
                        );
                        break;
                    case 2:
                        expect(location).toEqual(
                            secondLocationUpdateWithAddress
                        );
                        resolve();
                }
            });
        locationEventSubscription.triggerEvent(secondLocationUpdate);
        locationEventSubscription.remove();
    });
    locationMonitor.location.pipe(take(1)).subscribe((location: Location) => {
        expect(location).toEqual(secondLocationUpdateWithAddress);
    });
});

it("geolocation starts once when there are subscribers and stops once when there are none", async (): Promise<
    void
> => {
    jest.clearAllMocks();
    const locationUpdate = {
        //address: "6229 Lamar St., Arvada, CO 80003",
        latitude: 39.80963962521709,
        longitude: -105.06733748256252,
        time: new Date().valueOf()
    };
    expect.assertions(2);
    await new Promise(resolve => {
        locationMonitor.location
            .pipe(take(2))
            .subscribe(undefined, undefined, () => resolve());
        locationMonitor.location
            .pipe(take(2))
            .subscribe(undefined, undefined, () => resolve());
        locationEventSubscription.triggerEvent(locationUpdate);
        locationEventSubscription.remove();
    });
    expect(geoLocationMock.start).toHaveBeenCalledTimes(1);
    expect(geoLocationMock.stop).toHaveBeenCalledTimes(1);
});
