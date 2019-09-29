import MuTag, { MuTagColor } from './MuTag';
import Percent from './Percent';
import Hexadecimal from './Hexadecimal';

class InvalidBeaconID extends RangeError {

    constructor(value: string) {
        super(`${value} is an invalid beacon ID. Expected a 1-character hexadecimal value.`);
        this.name = 'InvalidBeaconID';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BeaconID extends Hexadecimal {

    static create(hex: string): BeaconID {
        if (!(hex.length === 1)) {
            throw new InvalidBeaconID(hex);
        }

        const numberValue = BeaconID.numberFromString(hex);
        return new BeaconID(hex, numberValue);
    }
}

export default class ProvisionedMuTag extends MuTag {

    protected uid: string;
    private beaconID: BeaconID;
    private muTagNumber: number;
    private name: string;
    protected batteryLevel: Percent;
    private color: MuTagColor;

    constructor(
        uid: string,
        beaconID: BeaconID,
        muTagNumber: number,
        name: string,
        batteryLevel: Percent,
        color: MuTagColor = MuTagColor.MuOrange,
    ) {
        super();
        this.uid = uid;
        this.beaconID = beaconID;
        this.muTagNumber = muTagNumber;
        this.name = name;
        this.batteryLevel = batteryLevel;
        this.color = color;
    }

    updateColor(color: MuTagColor): void {
        this.color = color;
    }
}
