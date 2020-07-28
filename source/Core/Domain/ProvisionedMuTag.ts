import MuTag, { MuTagColor } from "./MuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import Hexadecimal from "../../../source (restructure)/shared/metaLanguage/Hexadecimal";
import { BehaviorSubject, Observable, combineLatest, Subject } from "rxjs";
import { map } from "rxjs/operators";
import isType, {
    RuntimeType
} from "../../../source (restructure)/shared/metaLanguage/isType";

class InvalidBeaconId extends RangeError {
    constructor(value: string) {
        super(
            `${value} is an invalid beacon ID. Expected a 1-character hexadecimal value.`
        );
        this.name = "InvalidBeaconId";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BeaconId extends Hexadecimal {
    static create(hex: string): BeaconId {
        if (!(hex.length === 1)) {
            throw new InvalidBeaconId(hex);
        }

        const numberValue = BeaconId.numberFromString(hex);
        return new BeaconId(hex, numberValue);
    }
}

export interface Address {
    formattedAddress: string;
    route: string;
    locality: string;
    administrativeAreaLevel1: string;
}

export interface MuTagData {
    readonly _advertisingInterval: number;
    readonly _batteryLevel: Percent;
    readonly _beaconId: BeaconId;
    readonly _color: MuTagColor;
    readonly _dateAdded: Date;
    readonly _didExitRegion: boolean;
    readonly _firmwareVersion: string;
    readonly _isSafe: boolean;
    readonly _lastSeen: Date;
    readonly _macAddress: string;
    readonly _modelNumber: string;
    readonly _muTagNumber: number;
    readonly _name: string;
    readonly _recentAddress?: Address;
    readonly _recentLatitude: number;
    readonly _recentLongitude: number;
    readonly _txPower: number;
    readonly _uid: string;
}

export interface MuTagJson {
    readonly _advertisingInterval: number;
    readonly _batteryLevel: number;
    readonly _beaconId: string;
    readonly _color: number;
    readonly _dateAdded: string;
    readonly _didExitRegion: boolean;
    readonly _firmwareVersion: string;
    readonly _isSafe: boolean;
    readonly _lastSeen: string;
    readonly _macAddress: string;
    readonly _modelNumber: string;
    readonly _muTagNumber: number;
    readonly _name: string;
    readonly _recentAddress?: Address;
    readonly _recentLatitude: number;
    readonly _recentLongitude: number;
    readonly _txPower: number;
    readonly _uid: string;
}

export function assertIsMuTagJson(object: {
    [key: string]: any;
}): asserts object is MuTagJson {
    const propertyRequirements = new Map([
        ["_advertisingInterval", RuntimeType.Number],
        ["_batteryLevel", RuntimeType.Number],
        ["_beaconId", RuntimeType.String],
        ["_color", RuntimeType.Number],
        ["_dateAdded", RuntimeType.String],
        ["_didExitRegion", RuntimeType.Boolean],
        ["_firmwareVersion", RuntimeType.String],
        ["_isSafe", RuntimeType.Boolean],
        ["_lastSeen", RuntimeType.String],
        ["_macAddress", RuntimeType.String],
        ["_modelNumber", RuntimeType.String],
        ["_muTagNumber", RuntimeType.Number],
        ["_name", RuntimeType.String],
        ["_recentLatitude", RuntimeType.Number],
        ["_recentLongitude", RuntimeType.Number],
        ["_txPower", RuntimeType.Number],
        ["_uid", RuntimeType.String]
    ]);
    for (const [key, type] of propertyRequirements) {
        if (!(key in object && isType(object[key], type))) {
            throw Error("Object is not MuTagJson.");
        }
    }
    const optionalPropertyRequirements = new Map([
        ["_recentAddress", RuntimeType.String]
    ]);
    for (const [key, type] of optionalPropertyRequirements) {
        if (key in object) {
            if (!isType(object[key], type)) {
                throw Error("Object is not AccountJson.");
            }
        }
    }
}

interface SafetyStatus {
    readonly isSafe: boolean;
    readonly lastSeen: Date;
}
export interface Location {
    latitude: number;
    longitude: number;
}

interface AccessorValue {
    readonly batteryLevel: BehaviorSubject<Percent>;
    readonly didEnterRegion: Subject<void>;
    readonly isSafe: BehaviorSubject<boolean>;
    readonly lastSeen: BehaviorSubject<Date>;
    readonly recentAddress: BehaviorSubject<Address | undefined>;
    readonly recentLatitude: BehaviorSubject<number>;
    readonly recentLongitude: BehaviorSubject<number>;
}

export default class ProvisionedMuTag extends MuTag {
    private _advertisingInterval: number;
    protected _batteryLevel: Percent;
    private readonly _beaconId: BeaconId;
    private _color: MuTagColor;
    private readonly _dateAdded: Date;
    private _didExitRegion: boolean;
    private _firmwareVersion: string;
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
    private readonly _macAddress: string;
    private _modelNumber: string;
    private readonly _muTagNumber: number;
    private _name: string;
    private get _recentAddress(): Address | undefined {
        return this._accessorValue.recentAddress.value;
    }
    private set _recentAddress(newValue: Address | undefined) {
        this._accessorValue.recentAddress.next(newValue);
    }
    private get _recentLatitude(): number {
        return this._accessorValue.recentLatitude.value;
    }
    private set _recentLatitude(newValue: number) {
        this._accessorValue.recentLatitude.next(newValue);
    }
    private get _recentLongitude(): number {
        return this._accessorValue.recentLongitude.value;
    }
    private set _recentLongitude(newValue: number) {
        this._accessorValue.recentLongitude.next(newValue);
    }
    private _txPower: number;
    protected readonly _uid: string;

    // This property is not part of the model. It only serves to make some
    // properties observable.
    private readonly _accessorValue: AccessorValue;

    readonly address: Observable<Address | undefined>;

    readonly batteryLevel: Observable<Percent>;

    get beaconId(): BeaconId {
        return this._beaconId;
    }

    readonly didEnterRegion: Observable<void>;

    get inRange(): boolean {
        return !this._didExitRegion;
    }

    get isSafe(): boolean {
        return this._isSafe;
    }

    get lastSeen(): Date {
        return this._lastSeen;
    }

    get location(): Observable<Location> {
        return combineLatest(
            this._accessorValue.recentLatitude,
            this._accessorValue.recentLongitude
        ).pipe(
            map(
                ([latitude, longitude]): Location => ({
                    latitude: latitude,
                    longitude: longitude
                })
            )
        );
    }

    get name(): string {
        return this._name;
    }

    get safetyStatus(): Observable<SafetyStatus> {
        return combineLatest(
            this._accessorValue.isSafe,
            this._accessorValue.lastSeen
        ).pipe(
            map(
                ([isSafe, lastSeen]): SafetyStatus => ({
                    isSafe: isSafe,
                    lastSeen: lastSeen
                })
            )
        );
    }

    get json(): MuTagJson {
        const json = this.serialize();
        return JSON.parse(json);
    }

    /* I am using an object interface for this constructor so that I can easily
     * use the JSON.parse reviver object to instantiate this class. This makes
     * it much easier to modify the private properties of this class because
     * mapping properties for the constructor is not required.
     */
    constructor(muTagData: MuTagData) {
        super();
        this._advertisingInterval = muTagData._advertisingInterval;
        this._batteryLevel = muTagData._batteryLevel;
        this._beaconId = muTagData._beaconId;
        this._color = muTagData._color;
        this._dateAdded = muTagData._dateAdded;
        this._didExitRegion = muTagData._didExitRegion;
        this._firmwareVersion = muTagData._firmwareVersion;
        this._macAddress = muTagData._macAddress;
        this._modelNumber = muTagData._modelNumber;
        this._muTagNumber = muTagData._muTagNumber;
        this._name = muTagData._name;
        this._txPower = muTagData._txPower;
        this._uid = muTagData._uid;
        this._accessorValue = {
            batteryLevel: new BehaviorSubject(muTagData._batteryLevel),
            didEnterRegion: new Subject<void>(),
            isSafe: new BehaviorSubject(muTagData._isSafe),
            lastSeen: new BehaviorSubject(muTagData._lastSeen),
            recentAddress: new BehaviorSubject(muTagData._recentAddress),
            recentLatitude: new BehaviorSubject(muTagData._recentLatitude),
            recentLongitude: new BehaviorSubject(muTagData._recentLongitude)
        };
        this.address = this._accessorValue.recentAddress.asObservable();
        this.batteryLevel = this._accessorValue.batteryLevel.asObservable();
        this.didEnterRegion = this._accessorValue.didEnterRegion.asObservable();
    }

    changeColor(color: MuTagColor): void {
        this._color = color;
    }

    updateAddress(address: Address): void {
        if (this._didExitRegion) {
            return;
        }
        this._recentAddress = address;
    }

    updateBatteryLevel(level: Percent): void {
        this._accessorValue.batteryLevel.next(level);
    }

    updateLocation(latitude: number, longitude: number): void {
        if (this._didExitRegion) {
            return;
        }
        this._recentLatitude = latitude;
        this._recentLongitude = longitude;
    }

    userDidDetect(timestamp: Date): void {
        this._isSafe = true;
        this._lastSeen = timestamp;
        if (this._didExitRegion) {
            this._didExitRegion = false;
            this._accessorValue.didEnterRegion.next();
        }
    }

    userDidExitRegion(): void {
        this._didExitRegion = true;
        this._isSafe = false;
    }

    serialize(): string {
        return JSON.stringify(this, ProvisionedMuTag.replacer);
    }

    static deserialize(json: string | MuTagJson): ProvisionedMuTag {
        const jsonString =
            typeof json === "string" ? json : JSON.stringify(json);
        return JSON.parse(jsonString, ProvisionedMuTag.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case "":
                /* Class getters are not actual object properties. Must manually
                 * populate any class getter properties and copy the class object
                 * properties into a new object.
                 */
                return Object.assign(
                    {
                        _isSafe: value._isSafe,
                        _lastSeen: value._lastSeen,
                        _recentAddress: value._recentAddress,
                        _recentLatitude: value._recentLatitude,
                        _recentLongitude: value._recentLongitude
                    },
                    value
                );
            case "_batteryLevel":
                return value.valueOf();
            case "_beaconId":
                return value.toString();
            /*case 'lastSeen':
                return value.toISOString();*/
            case "address":
            case "batteryLevel":
            case "didEnterRegion":
            case "_accessorValue":
                // This property is not part of the model. It only serves to
                // make some properties observable.
                return;
            default:
                return value;
        }
    }

    static reviver(key: string, value: any): any {
        switch (key) {
            case "":
                return new ProvisionedMuTag(value);
            case "_batteryLevel":
                return new Percent(value);
            case "_beaconId":
                return BeaconId.create(value);
            case "_dateAdded":
            case "_lastSeen":
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
