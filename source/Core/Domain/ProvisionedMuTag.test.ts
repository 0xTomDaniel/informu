import ProvisionedMuTag, {
    BeaconId,
    MuTagJSON,
    MuTagData
} from "./ProvisionedMuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import { MuTagColor } from "./MuTag";

const muTagData: MuTagData = {
    _uid: "randomUUID",
    _beaconID: BeaconId.create("0"),
    _muTagNumber: 0,
    _name: "keys",
    _batteryLevel: new Percent(55),
    _isSafe: true,
    _lastSeen: new Date(),
    _color: MuTagColor.MuOrange
};
const referenceMuTag = new ProvisionedMuTag(muTagData);
const muTagJSON: MuTagJSON = {
    _uid: muTagData._uid,
    _beaconID: muTagData._beaconID.toString(),
    _muTagNumber: muTagData._muTagNumber,
    _name: muTagData._name,
    _batteryLevel: muTagData._batteryLevel.valueOf(),
    _color: muTagData._color,
    _isSafe: muTagData._isSafe,
    _lastSeen: muTagData._lastSeen.toISOString()
};

test("successfully creates Mu tag from MuTagJSON", (): void => {
    const muTag = ProvisionedMuTag.deserialize(muTagJSON);
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
