import MuTag, { MuTagColor } from './MuTag';
import Percent from './Percent';
import Hexadecimal from './Hexadecimal';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

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
    _uid: string;
    _beaconID: BeaconID;
    _muTagNumber: number;
    _name: string;
    _batteryLevel: Percent;
    _isSafe: boolean;
    _lastSeen: Date;
    _color: MuTagColor;
}

export interface MuTagJSON {
    _uid: string;
    _beaconID: string;
    _muTagNumber: number;
    _name: string;
    _batteryLevel: number;
    _color: number;
    _isSafe: boolean;
    _lastSeen: string;
}

export const isMuTagJSON = (object: { [key: string]: any }): object is MuTagJSON => {
    return '_uid' in object && typeof object._uid === 'string'
        && '_beaconID' in object && typeof object._beaconID === 'string'
        && '_muTagNumber' in object && typeof object._muTagNumber === 'number'
        && '_name' in object && typeof object._name === 'string'
        && '_batteryLevel' in object && typeof object._batteryLevel === 'number'
        && '_color' in object && typeof object._color === 'number'
        && '_isSafe' in object && typeof object._isSafe === 'boolean'
        && '_lastSeen' in object && typeof object._lastSeen === 'string';
};

interface SafetyStatus {
    readonly isSafe: boolean;
    readonly lastSeen: Date;
}

interface AccessorValue {
    readonly isSafe: BehaviorSubject<boolean>;
    readonly lastSeen: BehaviorSubject<Date>;
}

export default class ProvisionedMuTag extends MuTag {

    protected readonly _uid: string;
    private readonly _beaconID: BeaconID;
    private readonly _muTagNumber: number;
    private _name: string;
    protected _batteryLevel: Percent;
    private _color: MuTagColor;
    private get _isSafe(): boolean {
        return this._accessorValue.isSafe.value;
    }
    private set _isSafe(newValue: boolean) {
        this._accessorValue.isSafe.next(newValue);
    }
    private get _lastSeen(): Date {
        return this._accessorValue.lastSeen.value;
    }
    private set _lastSeen(newValue: Date) {
        this._accessorValue.lastSeen.next(newValue);
    }

    private readonly _accessorValue: AccessorValue;

    /* I am using an object interface for this constructor so that I can easily
     * use the JSON.parse reviver object to instantiate this class. This makes
     * it much easier to modify the private properties of this class because
     * mapping properties for the constructor is not required.
     */
    constructor(muTagData: MuTagData) {
        super();
        this._uid = muTagData._uid;
        this._beaconID = muTagData._beaconID;
        this._muTagNumber = muTagData._muTagNumber;
        this._name = muTagData._name;
        this._batteryLevel = muTagData._batteryLevel;
        this._color = muTagData._color;
        this._accessorValue = {
            isSafe: new BehaviorSubject(muTagData._isSafe),
            lastSeen: new BehaviorSubject(muTagData._lastSeen),
        };
    }

    get beaconID(): BeaconID {
        return this._beaconID;
    }

    get name(): string {
        return this._name;
    }

    get isSafe(): boolean {
        return this._isSafe;
    }

    get lastSeen(): Date {
        return this._lastSeen;
    }

    get safetyStatus(): Observable<SafetyStatus> {
        return combineLatest(this._accessorValue.isSafe, this._accessorValue.lastSeen).pipe(
            map(([isSafe, lastSeen]): SafetyStatus => ({ isSafe: isSafe, lastSeen: lastSeen}))
        );
    }

    get json(): MuTagJSON {
        const json = this.serialize();
        return JSON.parse(json);
    }

    changeColor(color: MuTagColor): void {
        this._color = color;
    }

    userDidExitRegion(): void {
        this._isSafe = false;
    }

    userDidDetect(timestamp: Date): void {
        this._isSafe = true;
        this._lastSeen = timestamp;
    }

    serialize(): string {
        return JSON.stringify(this, ProvisionedMuTag.replacer);
    }

    static deserialize(json: string | MuTagJSON): ProvisionedMuTag {
        let jsonString = typeof json === 'string' ? json : JSON.stringify(json);
        return JSON.parse(jsonString, ProvisionedMuTag.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case '':
                /* Class getters are not actual object properties. Must manually
                 * populate any class getter properties and copy the class object
                 * properties into a new object.
                 */
                return Object.assign({
                    _isSafe: value._isSafe,
                    _lastSeen: value._lastSeen,
                }, value);
            case '_beaconID':
                return value.toString();
            case '_batteryLevel':
                return value.valueOf();
            /*case 'lastSeen':
                return value.toISOString();*/
            case '_accessorValue':
                // This property is not part of the model. It only serves to
                // make some properties observable.
                return;
            default:
                return value;
        }
    }

    static reviver(key: string, value: any): any {
        switch (key) {
            case '':
                return new ProvisionedMuTag(value);
            case '_beaconID':
                return BeaconID.create(value);
            case '_batteryLevel':
                return new Percent(value);
            case '_lastSeen':
                return new Date(value);
            default:
                return value;
        }
    }

    /*private onPropertyChange(key: string, value: any): void {
        switch (key) {
            case 'isSafe':
            case 'lastSeen':
                this.statusUpdateSubscriptions.forEach((callback): void => {
                    callback({ [key]: value });
                });
                break;
        }
    }*/
}
