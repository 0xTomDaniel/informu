import { Geocoder } from "./LocationMonitor";
import * as RNGeocoder from "react-native-geocoding";
import { Address } from "../LocationMonitorPort";

enum ReverseGeocodeStatus {
    Ok = "OK",
    ZeroResults = "ZERO_RESULTS",
    OverQueryLimit = "OVER_QUERY_LIMIT",
    RequestDenied = "REQUEST_DENIED",
    InvalidRequest = "INVALID_REQUEST",
    UnknownError = "UNKNOWN_ERROR"
}

enum GeocodeTypes {
    Route = "route",
    Locality = "locality",
    AdministrativeAreaLevel1 = "administrative_area_level_1"
}

interface AddressComponent {
    short_name: string;
    types: Array<GeocodeTypes>;
}

interface GeocodeResult {
    address_components: Array<AddressComponent>;
    formatted_address: string;
}

interface ReverseGeocodeResponse {
    status: ReverseGeocodeStatus;
    results: Array<GeocodeResult>;
}

export default class GeocoderImpl implements Geocoder {
    private readonly geocoder: RNGeocoder.default;

    constructor(geocoder: RNGeocoder.default) {
        this.geocoder = geocoder;
    }

    async reverseGeocode(
        latitude: number,
        longitude: number
    ): Promise<Address | undefined> {
        const response = ((await this.geocoder.from(
            latitude,
            longitude
        )) as unknown) as ReverseGeocodeResponse;
        switch (response.status) {
            case ReverseGeocodeStatus.Ok:
                break;
            case ReverseGeocodeStatus.ZeroResults:
                return;
            default:
                throw Error(response.status);
        }
        const firstResult = response.results[0];
        const addressComponents: { [key in GeocodeTypes]: string } = {
            route: "",
            locality: "",
            // eslint-disable-next-line @typescript-eslint/camelcase
            administrative_area_level_1: ""
        };
        const geocodeTypes = [
            GeocodeTypes.AdministrativeAreaLevel1,
            GeocodeTypes.Locality,
            GeocodeTypes.Route
        ];
        while (
            firstResult.address_components.length !== 0 &&
            geocodeTypes.length !== 0
        ) {
            const component = firstResult.address_components.shift();
            if (component?.types == null) {
                return;
            }
            for (let i = 0; i < component.types.length; i++) {
                const indexOfMatch = geocodeTypes.indexOf(component.types[i]);
                if (indexOfMatch === -1) {
                    continue;
                }
                const type = geocodeTypes.splice(indexOfMatch)[0];
                addressComponents[type] = component.short_name;
                break;
            }
        }
        return {
            formattedAddress: firstResult.formatted_address,
            route: addressComponents.route,
            locality: addressComponents.locality,
            administrativeAreaLevel1:
                addressComponents.administrative_area_level_1
        };
    }
}
