import MuTag, { MuTagColor } from './MuTag';
import Percent from './Percent';
import Hexadecimal from './Hexadecimal';
import { string } from 'prop-types';

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

export interface MuTagData {
    uid: string;
    beaconID: string;
    muTagNumber: number;
    name: string;
    batteryLevel: number;
    color: number;
    isSafe: boolean;
    lastSeen: string;
}

export const isMuTagData = (object: { [key: string]: any }): object is MuTagData => {
    return 'uid' in object && typeof object.uid === 'string'
        && 'beaconID' in object && typeof object.beaconID === 'string'
        && 'muTagNumber' in object && typeof object.muTagNumber === 'number'
        && 'name' in object && typeof object.name === 'string'
        && 'batteryLevel' in object && typeof object.batteryLevel === 'number'
        && 'color' in object && typeof object.color === 'number'
        && 'isSafe' in object && typeof object.isSafe === 'boolean'
        && 'lastSeen' in object && typeof object.lastSeen === 'string';
};

export default class ProvisionedMuTag extends MuTag {

    protected uid: string;
    private beaconID: BeaconID;
    private muTagNumber: number;
    private name: string;
    protected batteryLevel: Percent;
    private color: MuTagColor;
    private isSafe: boolean;
    private lastSeen: Date;

    constructor(
        uid: string,
        beaconID: BeaconID,
        muTagNumber: number,
        name: string,
        batteryLevel: Percent,
        isSafe: boolean,
        lastSeen: Date,
        color: MuTagColor = MuTagColor.MuOrange,
    ) {
        super();
        this.uid = uid;
        this.beaconID = beaconID;
        this.muTagNumber = muTagNumber;
        this.name = name;
        this.batteryLevel = batteryLevel;
        this.color = color;
        this.isSafe = isSafe;
        this.lastSeen = lastSeen;
    }

    updateColor(color: MuTagColor): void {
        this.color = color;
    }

    getName(): string {
        return this.name;
    }

    getIsSafe(): boolean {
        return this.isSafe;
    }

    getLastSeen(): Date {
        return this.lastSeen;
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
            /*case 'lastSeen':
                return value.toISOString();*/
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
            case 'lastSeen':
                return new Date(value);
            default:
                return value;
        }
    }
}
