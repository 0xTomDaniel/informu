import Localize, { RnLocalize } from "./Localize";
import { v4 as uuidV4 } from "uuid";

const RnLocalizeMock = jest.fn<RnLocalize, any>(
    (): RnLocalize => ({
        getCalendar: jest.fn(),
        getCountry: jest.fn(),
        getCurrencies: jest.fn(),
        getLocales: jest.fn(() => [
            {
                languageCode: "",
                countryCode: "",
                languageTag: "en-US",
                isRTL: true
            }
        ]),
        getNumberFormatSettings: jest.fn(),
        getTemperatureUnit: jest.fn(),
        getTimeZone: jest.fn(),
        uses24HourClock: jest.fn(() => false),
        usesAutoDateAndTime: jest.fn(() => false),
        usesAutoTimeZone: jest.fn(() => false),
        usesMetricSystem: jest.fn(() => false)
    })
);
const rnLocalizeMock = RnLocalizeMock();

beforeAll(() => {
    Localize.createInstance(rnLocalizeMock);
});

test("Replace one string variable.", () => {
    expect.assertions(1);

    const batteryLevel = 9;
    const convertedString = Localize.instance.replaceVariables(
        "Unable to add MuTag because its battery is below ${ A }%. Please charge MuTag and try again.",
        [batteryLevel]
    );

    expect(convertedString).toBe(
        `Unable to add MuTag because its battery is below ${batteryLevel}%. Please charge MuTag and try again.`
    );
});

test("Replace two string variables.", () => {
    expect.assertions(2);

    const batteryLevel = 9;
    const convertedString01 = Localize.instance.replaceVariables(
        "Unable to add MuTag because its battery is below ${ A }%. Please charge MuTag and try again.",
        [batteryLevel]
    );
    expect(convertedString01).toBe(
        `Unable to add MuTag because its battery is below ${batteryLevel}%. Please charge MuTag and try again.`
    );

    const randomVar = uuidV4();
    const convertedString02 = Localize.instance.replaceVariables(
        "Battery level is ${ A }%. randomVar is ${ B }.",
        [batteryLevel, randomVar]
    );
    expect(convertedString02).toBe(
        `Battery level is ${batteryLevel}%. randomVar is ${randomVar}.`
    );
});
