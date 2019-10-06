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

interface MuTagData {
    uid: string;
    beaconID: BeaconID;
    muTagNumber: number;
    name: string;
    batteryLevel: Percent;
    color: MuTagColor;
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

    getMuTagData(): MuTagData {
        const json = this.serialize();
        return JSON.parse(json);
    }

    serialize(): string {
        return JSON.stringify(this, ProvisionedMuTag.replacer);
    }

    static deserialize(json: string | MuTagData): ProvisionedMuTag {
        let jsonString = typeof json === 'string' ? json : JSON.stringify(json);
        return JSON.parse(jsonString, ProvisionedMuTag.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case 'beaconID':
                return value.toString();
            case 'batteryLevel':
                return value.valueOf();
            default:
                return value;
        }
    }

    static reviver(key: string, value: any): any {
        switch (key) {
            case '':
                const muTag = Object.create(ProvisionedMuTag.prototype);
                return Object.assign(muTag, value);
            case 'beaconID':
                return BeaconID.create(value);
            case 'batteryLevel':
                return new Percent(value);
            default:
                return value;
        }
    }
}
