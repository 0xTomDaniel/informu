import { NewAccountFactory } from "../Ports/NewAccountFactory";
import Account, { AccountNumber } from "./Account";
import database from "@react-native-firebase/database";
import _ from "lodash";
import { BeaconId } from "./ProvisionedMuTag";

export class FailedToCreateNewAccount extends Error {
    constructor() {
        super("Failed to create a new Account. Please try again.");
        this.name = "FailedToCreateNewAccount";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FailedToGetNewAccountNumber extends Error {
    constructor() {
        super("Failed to get a new account number. Please try again.");
        this.name = "FailedToGetNewAccountNumber";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AccountLimitReached extends Error {
    constructor() {
        super(
            "The maximum number of accounts has been reached. Please contact support@informu.io"
        );
        this.name = "AccountLimitReached";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MalformedData extends Error {
    constructor() {
        super("The data received from the database is malformed.");
        this.name = "MalformedData";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

interface AccountIDs {
    [key: string]: boolean;
}

function assertIsAccountIDs(val: any): asserts val is AccountIDs {
    if (typeof val !== "object") {
        throw new MalformedData();
    }
}

export default class NewAccountFactoryImpl implements NewAccountFactory {
    async create(uid: string, emailAddress: string): Promise<Account> {
        try {
            const newAccountNumber = await this.getNewAccountNumber();
            return new Account({
                _uid: uid,
                _accountNumber: newAccountNumber,
                _emailAddress: emailAddress,
                _nextBeaconID: BeaconId.create("0"),
                _recycledBeaconIDs: new Set(),
                _nextMuTagNumber: 0,
                _muTags: new Set()
            });
        } catch (e) {
            console.warn(e);
            if (e instanceof AccountLimitReached) {
                throw e;
            }
            throw new FailedToCreateNewAccount();
        }
    }

    private async getNewAccountNumber(): Promise<AccountNumber> {
        const recycledAccountNumber = await this.getRecycledAccountNumber();
        return recycledAccountNumber ?? (await this.getNextAccountNumber());
    }

    private async getRecycledAccountNumber(): Promise<
        AccountNumber | undefined
    > {
        let newAccountNumber: AccountNumber | undefined;

        // https://stackoverflow.com/questions/28811037/data-in-transaction-is-null
        //
        // Transaction may return null first from the locally cached value.
        //
        const transactionUpdate = (
            currentData?: any
        ): AccountIDs | null | undefined => {
            if (currentData == null) {
                return currentData;
            }
            assertIsAccountIDs(currentData);
            const recycledAccountIDs = _.toPairs(currentData);
            const newAccountNumberHex = recycledAccountIDs
                .shift()?.[0]
                .replace(/^"(.*)"$/, "$1");
            if (newAccountNumberHex == null) {
                return;
            }
            newAccountNumber = AccountNumber.fromString(newAccountNumberHex);
            return _.fromPairs(recycledAccountIDs);
        };
        const result = await database()
            .ref("recycled_account_ids")
            .transaction(transactionUpdate);
        return result.committed ? newAccountNumber : undefined;
    }

    private async getNextAccountNumber(): Promise<AccountNumber> {
        let error: any | undefined;
        let newAccountNumber: AccountNumber | undefined;
        const transactionUpdate = (
            currentData?: string
        ): string | undefined => {
            if (currentData == null) {
                newAccountNumber = AccountNumber.fromString("0000000");
                return "0000001";
            }
            if (currentData === "FFFFFFF") {
                error = new AccountLimitReached();
                return;
            }
            newAccountNumber = AccountNumber.fromString(currentData);
            return AccountNumber.increment(newAccountNumber).toString();
        };
        const result = await database()
            .ref("next_account_id")
            .transaction(transactionUpdate);
        if (error != null) {
            throw error;
        }
        if (!result.committed || newAccountNumber == null) {
            throw new FailedToGetNewAccountNumber();
        }
        return newAccountNumber;
    }
}
