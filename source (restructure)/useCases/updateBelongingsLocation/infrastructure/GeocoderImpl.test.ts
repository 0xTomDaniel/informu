/* eslint-disable @typescript-eslint/camelcase */
import GeocoderImpl from "./GeocoderImpl";
import Geocoder from "react-native-geocoding";

const RnGeocodingMock = jest.fn<Geocoder, any>(
    (): Geocoder => ({
        init: jest.fn(),
        isInit: jest.fn(),
        setApiKey: jest.fn(),
        getFromLocation: jest.fn(),
        getFromLatLng: jest.fn(),
        from: jest.fn()
    })
);
const rnGeocodingMock = RnGeocodingMock();
const geocoder = new GeocoderImpl(rnGeocodingMock);

it("returns correct reverse geocode result", async (): Promise<void> => {
    const response = {
        status: "OK",
        results: [
            {
                address_components: [
                    {
                        long_name: "9350",
                        short_name: "9350",
                        types: ["street_number"]
                    },
                    {
                        long_name: "Quitman Street",
                        short_name: "Quitman St",
                        types: ["route"]
                    },
                    {
                        long_name: "East Central Westminster",
                        short_name: "East Central Westminster",
                        types: ["neighborhood", "political"]
                    },
                    {
                        long_name: "Westminster",
                        short_name: "Westminster",
                        types: ["locality", "political"]
                    },
                    {
                        long_name: "Adams County",
                        short_name: "Adams County",
                        types: ["administrative_area_level_2", "political"]
                    },
                    {
                        long_name: "Colorado",
                        short_name: "CO",
                        types: ["administrative_area_level_1", "political"]
                    },
                    {
                        long_name: "United States",
                        short_name: "US",
                        types: ["country", "political"]
                    },
                    {
                        long_name: "80031",
                        short_name: "80031",
                        types: ["postal_code"]
                    },
                    {
                        long_name: "6443",
                        short_name: "6443",
                        types: ["postal_code_suffix"]
                    }
                ],
                formatted_address: "9350 Quitman St, Westminster, CO 80031, USA"
            }
        ]
    };

    (rnGeocodingMock.from as jest.Mock).mockResolvedValueOnce(response);
    const coordinates = { latitude: 39.86669274, longitude: -105.03993666 };
    const result = await geocoder.reverseGeocode(
        coordinates.latitude,
        coordinates.longitude
    );
    expect(result).toEqual({
        formattedAddress: "9350 Quitman St, Westminster, CO 80031, USA",
        route: "Quitman St",
        locality: "Westminster",
        administrativeAreaLevel1: "CO"
    });
});
