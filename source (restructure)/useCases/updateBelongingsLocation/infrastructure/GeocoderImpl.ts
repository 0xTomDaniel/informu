import { Geocoder } from "./LocationMonitor";
import * as RNGeocoder from "react-native-geocoding";

export default class GeocoderImpl implements Geocoder {
    private readonly geocoder: RNGeocoder.default;

    constructor(geocoder: RNGeocoder.default) {
        this.geocoder = geocoder;
    }

    reverseGeocode(latitude: number, longitude: number): Promise<string> {
        return this.geocoder.getFromLatLng(latitude, longitude);
    }
}
