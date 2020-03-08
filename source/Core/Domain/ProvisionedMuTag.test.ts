import ProvisionedMuTag, {
    BeaconId,
    MuTagJson,
    MuTagData
} from "./ProvisionedMuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import { MuTagColor } from "./MuTag";

const dateNow = new Date();
const muTagData: MuTagData = {
    _advertisingInterval: 1,
    _batteryLevel: new Percent(55),
    _beaconId: BeaconId.create("0"),
    _color: MuTagColor.MuOrange,
    _dateAdded: dateNow,
    _didExitRegion: false,
    _firmwareVersion: "1.6.1",
    _isSafe: true,
    _lastSeen: dateNow,
    _macAddress: "63BC5DEF8900",
    _modelNumber: "REV8",
    _muTagNumber: 0,
    _name: "keys",
    _recentLatitude: 0,
    _recentLongitude: 0,
    _txPower: 1,
    _uid: "randomUUID"
};
const referenceMuTag = new ProvisionedMuTag(muTagData);
const muTagJson: MuTagJson = {
    _advertisingInterval: muTagData._advertisingInterval,
    _batteryLevel: muTagData._batteryLevel.valueOf(),
    _beaconId: muTagData._beaconId.toString(),
    _color: muTagData._color,
    _dateAdded: muTagData._dateAdded.toISOString(),
    _didExitRegion: muTagData._didExitRegion,
    _firmwareVersion: muTagData._firmwareVersion,
    _isSafe: muTagData._isSafe,
    _lastSeen: muTagData._lastSeen.toISOString(),
    _macAddress: muTagData._macAddress,
    _modelNumber: muTagData._modelNumber,
    _muTagNumber: muTagData._muTagNumber,
    _name: muTagData._name,
    _recentLatitude: muTagData._recentLatitude,
    _recentLongitude: muTagData._recentLongitude,
    _txPower: muTagData._txPower,
    _uid: muTagData._uid
};

test("successfully creates Mu tag from MuTagJSON", (): void => {
    const muTag = ProvisionedMuTag.deserialize(muTagJson);
    expect(muTag).toEqual(referenceMuTag);
});

test("successfully serializes and deserializes Mu tag", (): void => {
    // This is to ensure JSON.stringify doesn't throw error 'TypeError: Converting
    // circular structure to JSON'
    const subscription = referenceMuTag.safetyStatus.subscribe(
        (safetyStatus): void => {
            console.log(safetyStatus);
        }
    );

    const json = referenceMuTag.serialize();
    const muTag = ProvisionedMuTag.deserialize(json);

    // Unsubscribing ensures equality
    subscription.unsubscribe();
    expect(muTag).toEqual(referenceMuTag);
});
