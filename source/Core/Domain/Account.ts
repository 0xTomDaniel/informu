import Hexadecimal from "../../../source (restructure)/shared/metaLanguage/Hexadecimal";
import { BeaconId } from "./ProvisionedMuTag";
import { BehaviorSubject, Observable } from "rxjs";
import { pairwise, map } from "rxjs/operators";
import _ from "lodash";
import isType, {
    RuntimeType
} from "../../../source (restructure)/shared/metaLanguage/isType";

class InvalidAccountNumber extends RangeError {
    constructor(value: string) {
        super(
            `${value} is an invalid account number. Expected a 7-character hexadecimal value.`
        );
        this.name = "InvalidAccountNumber";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AccountNumber extends Hexadecimal {
    static fromString<T extends AccountNumber>(hex: string): T {
        this.assertValidLength(hex.length, hex);
        return super.fromString(hex);
    }

    static fromNumber<T extends AccountNumber>(
        value: number,
        prefix = false,
        minLength?: number
    ): T {
        const hex = super.fromNumber<T>(value, prefix, minLength);
        const hexString = hex.toString();
        this.assertValidLength(hexString.length, hexString);
        return hex;
    }

    static increment<T extends AccountNumber>(value: T): T {
        const incremented = value.valueOf() + 1;
        return this.fromNumber(incremented, false, 7);
    }

    private static assertValidLength(
        hexLength: number,
        hex: string
    ): asserts hexLength is 7 {
        if (hex.length !== 7) {
            throw new InvalidAccountNumber(hex);
        }
    }
}

class NewBeaconIdNotFound extends Error {
    constructor(value: string) {
        super(`New beacon ID ${value} not found.`);
        this.name = "NewBeaconIdNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface AccountData {
    readonly _accountNumber: AccountNumber;
    readonly _emailAddress: string;
    readonly _muTags: Set<string>;
    readonly _name: string;
    readonly _nextBeaconId: BeaconId;
    readonly _nextMuTagNumber: number;
    readonly _nextSafeZoneNumber: number;
    readonly _onboarding: boolean;
    readonly _recycledBeaconIds: Set<BeaconId>;
    readonly _sessionId?: string;
    readonly _uid: string;
}

export interface AccountJson {
    readonly _accountNumber: string;
    readonly _emailAddress: string;
    readonly _muTags?: string[];
    readonly _name: string;
    readonly _nextBeaconId: string;
    readonly _nextMuTagNumber: number;
    readonly _nextSafeZoneNumber: number;
    readonly _onboarding: boolean;
    readonly _recycledBeaconIds?: string[];
    readonly _sessionId?: string;
    readonly _uid: string;
}

export function assertIsAccountJson(object: {
    [key: string]: any;
}): asserts object is AccountJson {
    const propertyRequirements = new Map([
        ["_accountNumber", RuntimeType.String],
        ["_emailAddress", RuntimeType.String],
        ["_name", RuntimeType.String],
        ["_nextBeaconId", RuntimeType.String],
        ["_nextMuTagNumber", RuntimeType.Number],
        ["_nextSafeZoneNumber", RuntimeType.Number],
        ["_onboarding", RuntimeType.Boolean],
        ["_uid", RuntimeType.String]
    ]);
    for (const [key, type] of propertyRequirements) {
        if (!(key in object && isType(object[key], type))) {
            throw Error("Object is not AccountJson.");
        }
    }
    const optionalPropertyRequirements = new Map([
        ["_muTags", RuntimeType.StringArray],
        ["_recycledBeaconIds", RuntimeType.StringArray],
        ["_sessionId", RuntimeType.String]
    ]);
    for (const [key, type] of optionalPropertyRequirements) {
        if (key in object) {
            if (!isType(object[key], type)) {
                throw Error("Object is not AccountJson.");
            }
        }
    }
}

interface AccessorValue {
    readonly muTags: BehaviorSubject<Set<string>>;
}

export interface MuTagsChange {
    insertion?: string;
    deletion?: string;
}

export default class Account {
    private readonly _accountNumber: AccountNumber;
    private _emailAddress: string;
    private get _muTags(): Set<string> {
        return this._accessorValue.muTags.value;
    }
    private set _muTags(newValue: Set<string>) {
        this._accessorValue.muTags.next(newValue);
    }
    private _name: string;
    private _nextBeaconId: BeaconId;
    private _nextMuTagNumber: number;
    private _nextSafeZoneNumber: number;
    private _onboarding: boolean;
    private readonly _recycledBeaconIds: Set<BeaconId>;
    private _sessionId?: string;
    private readonly _uid: string;

    // This property is not part of the model. It only serves to make some
    // properties observable.
    private readonly _accessorValue: AccessorValue;

    constructor(accountData: AccountData) {
        this._accountNumber = accountData._accountNumber;
        this._emailAddress = accountData._emailAddress;
        this._name = accountData._name;
        this._nextBeaconId = accountData._nextBeaconId;
        this._nextMuTagNumber = accountData._nextMuTagNumber;
        this._nextSafeZoneNumber = accountData._nextSafeZoneNumber;
        this._onboarding = accountData._onboarding;
        this._recycledBeaconIds = accountData._recycledBeaconIds;
        this._sessionId = accountData._sessionId;
        this._uid = accountData._uid;
        this._accessorValue = {
            muTags: new BehaviorSubject(accountData._muTags)
        };
    }

    get uid(): string {
        return this._uid;
    }

    get accountNumber(): AccountNumber {
        return this._accountNumber;
    }

    get newBeaconId(): BeaconId {
        if (this._recycledBeaconIds.size !== 0) {
            return this._recycledBeaconIds.values().next().value;
        }

        return this._nextBeaconId;
    }

    get newMuTagNumber(): number {
        return this._nextMuTagNumber;
    }

    get muTags(): Set<string> {
        return this._muTags;
    }

    get muTagsChange(): Observable<MuTagsChange> {
        return this._accessorValue.muTags.pipe(
            pairwise(),
            map(
                ([previousMuTags, currentMuTags]): MuTagsChange => {
                    return {
                        insertion: _.difference(
                            [...currentMuTags],
                            [...previousMuTags]
                        )[0],
                        deletion: _.difference(
                            [...previousMuTags],
                            [...currentMuTags]
                        )[0]
                    };
                }
            )
        );
    }

    get json(): AccountJson {
        const json = this.serialize();
        return JSON.parse(json);
    }

    addNewMuTag(muTagUID: string, beaconId: BeaconId): void {
        if (this._recycledBeaconIds.has(beaconId)) {
            this._recycledBeaconIds.delete(beaconId);
        } else if (this._nextBeaconId === beaconId) {
            this.incrementNextBeaconId();
        } else {
            throw new NewBeaconIdNotFound(beaconId.toString());
        }

        this._nextMuTagNumber += 1;
        // Must copy _muTags set or behavior subject's previous value will be
        // mutated
        this._muTags = new Set(this._muTags).add(muTagUID);
    }

    removeMuTag(muTagUID: string, beaconId: BeaconId): void {
        this._recycledBeaconIds.add(beaconId);
        // Must copy _muTags set or behavior subject's previous value will be
        // mutated
        const muTags = new Set(this._muTags);
        if (muTags.delete(muTagUID)) {
            this._muTags = muTags;
        }
    }

    setSession(sessionId: string): void {
        this._sessionId = sessionId;
    }

    clearSession(): void {
        this._sessionId = undefined;
    }

    isCurrentSession(sessionId: string): boolean {
        return this._sessionId === sessionId;
    }

    hasActiveSession(): boolean {
        return this._sessionId != null;
    }

    serialize(): string {
        return JSON.stringify(this, Account.replacer);
    }

    static deserialize(json: string | AccountJson): Account {
        const jsonString =
            typeof json === "string" ? json : JSON.stringify(json);
        return JSON.parse(jsonString, Account.reviver);
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
                        _muTags: value._muTags
                    },
                    value
                );
            case "_accountNumber":
                return value.stringValue;
            case "_nextBeaconId":
                return value.stringValue;
            case "_recycledBeaconIds": {
                const beaconIds: BeaconId[] = Array.from(value);
                return beaconIds.length === 0
                    ? undefined
                    : beaconIds.map((beaconId): string => beaconId.toString());
            }
            case "_muTags": {
                const muTags = Array.from(value);
                return muTags.length === 0 ? undefined : muTags;
            }
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
                if (value._recycledBeaconIds == null) {
                    value._recycledBeaconIds = new Set<BeaconId>();
                }

                if (value._muTags == null) {
                    value._muTags = new Set<string>();
                }

                return new Account(value);
            case "_accountNumber":
                return AccountNumber.fromString(value);
            case "_nextBeaconId":
                return BeaconId.create(value);
            case "_recycledBeaconIds":
                return new Set<BeaconId>(
                    value.map(
                        (hex: string): BeaconId => BeaconId.fromString(hex)
                    )
                );
            case "_muTags":
                return new Set<string>(value);
            default:
                return value;
        }
    }

    private incrementNextBeaconId(): void {
        const previousBeaconId = this._nextBeaconId.valueOf();
        const nextBeaconIdNumber = previousBeaconId + 1;
        const nextBeaconIdHex = nextBeaconIdNumber.toString(16).toUpperCase();
        const nextBeaconId = BeaconId.create(nextBeaconIdHex);
        this._nextBeaconId = nextBeaconId;
    }
}
