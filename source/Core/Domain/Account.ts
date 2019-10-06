import Hexadecimal from './Hexadecimal';
import { BeaconID } from './ProvisionedMuTag';

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
    readonly uid: string;
    readonly accountNumber: string;
    readonly emailAddress: string;
    readonly nextBeaconID: string;
    readonly recycledBeaconIDs?: string[];
    readonly nextMuTagNumber: number;
    readonly muTags?: string[];
}

const isStringArray = (value: any): value is string[] => {
    return Array.isArray(value) && value.every((item): boolean => typeof item === 'string');
};

export const isAccountData = (object: { [key: string]: any }): object is AccountData => {
    return 'uid' in object && typeof object.uid === 'string'
        && 'accountNumber' in object && typeof object.accountNumber === 'string'
        && 'emailAddress' in object && typeof object.emailAddress === 'string'
        && 'nextBeaconID' in object && typeof object.nextBeaconID === 'string'
        && 'recycledBeaconIDs' in object ? isStringArray(object.recycledBeaconIDs) : true
        && 'nextMuTagNumber' in object && typeof object.nextMuTagNumber === 'string'
        && 'muTags' in object ? isStringArray(object.muTags) : true;
};

export default class Account {

    private readonly uid: string;
    private readonly accountNumber: AccountNumber;
    private emailAddress: string;
    private nextBeaconID: BeaconID;
    private recycledBeaconIDs: Set<BeaconID>;
    private nextMuTagNumber: number;
    private muTags: Set<string>;

    constructor(
        uid: string,
        accountNumber: AccountNumber,
        emailAddress: string,
        nextBeaconID: BeaconID,
        recycledBeaconIDs: BeaconID[],
        nextMuTagNumber: number,
        muTags: string[],
    ) {
        this.uid = uid;
        this.accountNumber = accountNumber;
        this.emailAddress = emailAddress;
        this.nextBeaconID = nextBeaconID;
        this.recycledBeaconIDs = new Set(recycledBeaconIDs);
        this.nextMuTagNumber = nextMuTagNumber;
        this.muTags = new Set(muTags);
    }

    getUID(): string {
        return this.uid;
    }

    getAccountNumber(): AccountNumber {
        return this.accountNumber;
    }

    getNewBeaconID(): BeaconID {
        if (this.recycledBeaconIDs.size !== 0) {
            return this.recycledBeaconIDs.values().next().value;
        }

        return this.nextBeaconID;
    }

    getNewMuTagNumber(): number {
        return this.nextMuTagNumber;
    }

    addNewMuTag(muTagUID: string, beaconID: BeaconID): void {
        if (this.recycledBeaconIDs.has(beaconID)) {
            this.recycledBeaconIDs.delete(beaconID);
        } else if (this.nextBeaconID === beaconID) {
            this.incrementNextBeaconID();
        } else {
            throw new NewBeaconIDNotFound(beaconID.toString());
        }

        this.muTags.add(muTagUID);
        this.nextMuTagNumber += 1;
    }

    getAccountData(): AccountData {
        const json = this.serialize();
        return JSON.parse(json);
    }

    serialize(): string {
        return JSON.stringify(this, Account.replacer);
    }

    static deserialize(json: string | AccountData): Account {
        let jsonString = typeof json === 'string' ? json : JSON.stringify(json);
        return JSON.parse(jsonString, Account.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case 'accountNumber':
                return value.stringValue;
            case 'nextBeaconID':
                return value.stringValue;
            case 'recycledBeaconIDs':
                const beaconIDs: BeaconID[] = Array.from(value);
                return beaconIDs.map((beaconID): string => beaconID.toString());
            case 'muTags':
                return Array.from(value);
            default:
                return value;
        }
    }

    static reviver(key: string, value: any): any {
        switch (key) {
            case '':
                const account = Object.create(Account.prototype);
                return Object.assign(account, value);
            case 'accountNumber':
                return AccountNumber.create(value);
            case 'nextBeaconID':
                return BeaconID.create(value);
            case 'recycledBeaconIDs':
                return new Set(value.map(
                    (hex: string): BeaconID => BeaconID.fromString(hex)
                ));
            case 'muTags':
                return new Set(value);
            default:
                return value;
        }
    }

    private incrementNextBeaconID(): void {
        const previousBeaconID = this.nextBeaconID.valueOf();
        const nextBeaconIDNumber = previousBeaconID + 1;
        const nextBeaconIDHex = nextBeaconIDNumber.toString(16).toUpperCase();
        const nextBeaconID = BeaconID.create(nextBeaconIDHex);
        this.nextBeaconID = nextBeaconID;
    }
}
