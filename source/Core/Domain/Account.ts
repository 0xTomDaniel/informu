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

export default class Account {

    private readonly uid: string;
    private readonly accountNumber: AccountNumber;
    private emailAddress: string;
    private nextBeaconID: BeaconID;
    private recycledBeaconIDs: Set<BeaconID>;

    constructor(
        uid: string,
        accountNumber: AccountNumber,
        emailAddress: string,
        nextBeaconID: BeaconID,
        recycledBeaconIDs: BeaconID[],
    ) {
        this.uid = uid;
        this.accountNumber = accountNumber;
        this.emailAddress = emailAddress;
        this.nextBeaconID = nextBeaconID;
        this.recycledBeaconIDs = new Set(recycledBeaconIDs);
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

    removeNewBeaconID(beaconID: BeaconID): void {
        if (this.recycledBeaconIDs.has(beaconID)) {
            this.recycledBeaconIDs.delete(beaconID);
        } else if (this.nextBeaconID === beaconID) {
            this.incrementNextBeaconID();
        } else {
            throw new NewBeaconIDNotFound(beaconID.toString());
        }
    }

    serialize(): string {
        return JSON.stringify(this, Account.replacer);
    }

    static deserialize(json: string): Account {
        return JSON.parse(json, Account.reviver);
    }

    static replacer(key: string, value: any): any {
        switch (key) {
            case 'recycledBeaconIDs':
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
                return AccountNumber.create(value.stringValue);
            case 'nextBeaconID':
                return BeaconID.create(value.stringValue);
            case 'recycledBeaconIDs':
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
