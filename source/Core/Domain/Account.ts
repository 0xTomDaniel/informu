import Hexadecimal from './Hexadecimal';
import { BeaconID } from './ProvisionedMuTag';
import { BehaviorSubject, Observable } from 'rxjs';
import { pairwise, map } from 'rxjs/operators';
import _ from 'lodash';

class InvalidAccountNumber extends RangeError {

    constructor(value: string) {
        super(`${value} is an invalid account number. Expected a 7-character hexadecimal value.`);
        this.name = 'InvalidAccountNumber';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AccountNumber extends Hexadecimal {

    static create(hex: string): AccountNumber {
        if (!(hex.length === 7)) {
            throw new InvalidAccountNumber(hex);
        }

        const numberValue = AccountNumber.numberFromString(hex);
        return new AccountNumber(hex, numberValue);
    }
}

class NewBeaconIDNotFound extends Error {

    constructor(value: string) {
        super(`New beacon ID ${value} not found.`);
        this.name = 'NewBeaconIDNotFound';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface AccountData {
    readonly _uid: string;
    readonly _accountNumber: AccountNumber;
    readonly _emailAddress: string;
    readonly _nextBeaconID: BeaconID;
    readonly _recycledBeaconIDs: Set<BeaconID>;
    readonly _nextMuTagNumber: number;
    readonly _muTags: Set<string>;
}

export interface AccountJSON {
    readonly _uid: string;
    readonly _accountNumber: string;
    readonly _emailAddress: string;
    readonly _nextBeaconID: string;
    readonly _recycledBeaconIDs?: string[];
    readonly _nextMuTagNumber: number;
    readonly _muTags?: string[];
}

const isStringArray = (value: any): value is string[] => {
    return Array.isArray(value) && value.every((item): boolean => typeof item === 'string');
};

export const isAccountJSON = (object: { [key: string]: any }): object is AccountJSON => {
    return '_uid' in object && typeof object.uid === 'string'
        && '_accountNumber' in object && typeof object.accountNumber === 'string'
        && '_emailAddress' in object && typeof object.emailAddress === 'string'
        && '_nextBeaconID' in object && typeof object.nextBeaconID === 'string'
        && '_recycledBeaconIDs' in object ? isStringArray(object.recycledBeaconIDs) : true
        && '_nextMuTagNumber' in object && typeof object.nextMuTagNumber === 'string'
        && '_muTags' in object ? isStringArray(object.muTags) : true;
};

interface AccessorValue {
    readonly muTags: BehaviorSubject<Set<string>>;
}

interface MuTagsChange {
    insertion?: string;
    deletion?: string;
}

export default class Account {

    private readonly _uid: string;
    private readonly _accountNumber: AccountNumber;
    private _emailAddress: string;
    private _nextBeaconID: BeaconID;
    private readonly _recycledBeaconIDs: Set<BeaconID>;
    private _nextMuTagNumber: number;
    private get _muTags(): Set<string> {
        return this._accessorValue.muTags.value;
    }
    private set _muTags(newValue: Set<string>) {
        this._accessorValue.muTags.next(newValue);
    }

    private readonly _accessorValue: AccessorValue;

    constructor(accountData: AccountData) {
        this._uid = accountData._uid;
        this._accountNumber = accountData._accountNumber;
        this._emailAddress = accountData._emailAddress;
        this._nextBeaconID = accountData._nextBeaconID;
        this._recycledBeaconIDs = accountData._recycledBeaconIDs;
        this._nextMuTagNumber = accountData._nextMuTagNumber;
        this._accessorValue = {
            muTags: new BehaviorSubject(accountData._muTags),
        };
    }

    get uid(): string {
        return this._uid;
    }

    get accountNumber(): AccountNumber {
        return this._accountNumber;
    }

    get newBeaconID(): BeaconID {
        if (this._recycledBeaconIDs.size !== 0) {
            return this._recycledBeaconIDs.values().next().value;
        }

        return this._nextBeaconID;
    }

    get newMuTagNumber(): number {
        return this._nextMuTagNumber;
    }

    get muTagsChange(): Observable<MuTagsChange> {
        return this._accessorValue.muTags.pipe(
            pairwise(),
            map(([previousMuTags, currentMuTags]): MuTagsChange => {
                return {
                    insertion: _.differenceBy([...currentMuTags], [...previousMuTags], 'uid')[0],
                    deletion: _.differenceBy([...previousMuTags], [...currentMuTags], 'uid')[0],
                };
            })
        );
    }

    get json(): AccountJSON {
        const json = this.serialize();
        return JSON.parse(json);
    }

    addNewMuTag(muTagUID: string, beaconID: BeaconID): void {
        if (this._recycledBeaconIDs.has(beaconID)) {
            this._recycledBeaconIDs.delete(beaconID);
        } else if (this._nextBeaconID === beaconID) {
            this.incrementNextBeaconID();
        } else {
            throw new NewBeaconIDNotFound(beaconID.toString());
        }

        this._nextMuTagNumber += 1;
        this._muTags = new Set(this._muTags).add(muTagUID);
    }

    removeMuTag(muTagUID: string, beaconID: BeaconID): void {
        this._recycledBeaconIDs.add(beaconID);
        const muTags = new Set(this._muTags);
        if (muTags.delete(muTagUID)) {
            this._muTags = muTags;
        }
    }

    serialize(): string {
        return JSON.stringify(this, Account.replacer);
    }

    static deserialize(json: string | AccountJSON): Account {
        let jsonString = typeof json === 'string' ? json : JSON.stringify(json);
        return JSON.parse(jsonString, Account.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case '':
                /* Class getters are not actual object properties. Must manually
                 * populate any class getter properties and copy the class object
                 * properties into a new object.
                 */
                return Object.assign({
                    _muTags: value._muTags,
                }, value);
            case '_accountNumber':
                return value.stringValue;
            case '_nextBeaconID':
                return value.stringValue;
            case '_recycledBeaconIDs':
                const beaconIDs: BeaconID[] = Array.from(value);
                return beaconIDs.map((beaconID): string => beaconID.toString());
            case '_muTags':
                return Array.from(value);
            default:
                return value;
        }
    }

    static reviver(key: string, value: any): any {
        switch (key) {
            case '':
                if (value.recycledBeaconIDs == null) {
                    value.recycledBeaconIDs = new Set<BeaconID>();
                }

                if (value.muTags == null) {
                    value.muTags = new Set<string>();
                }

                return new Account(value);
            case '_accountNumber':
                return AccountNumber.create(value);
            case '_nextBeaconID':
                return BeaconID.create(value);
            case '_recycledBeaconIDs':
                return new Set<BeaconID>(value.map(
                    (hex: string): BeaconID => BeaconID.fromString(hex)
                ));
            case '_muTags':
                return new Set<string>(value);
            default:
                return value;
        }
    }

    private incrementNextBeaconID(): void {
        const previousBeaconID = this._nextBeaconID.valueOf();
        const nextBeaconIDNumber = previousBeaconID + 1;
        const nextBeaconIDHex = nextBeaconIDNumber.toString(16).toUpperCase();
        const nextBeaconID = BeaconID.create(nextBeaconIDHex);
        this._nextBeaconID = nextBeaconID;
    }
}
