import { NewAccountFactory } from "../Ports/NewAccountFactory";
import Account, { AccountNumber } from "./Account";
import database from "@react-native-firebase/database";
import _ from "lodash";
import { BeaconId } from "./ProvisionedMuTag";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

const ExceptionType = [
    "AccountLimitReached",
    "FailedToCreateNewAccount",
    "FailedToGetNewAccountNumber",
    "MalformedData"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class NewAccountFactoryException<
    T extends ExceptionType
> extends Exception<T> {
    static AccountLimitReached(): NewAccountFactoryException<
        "AccountLimitReached"
    > {
        return new this(
            "AccountLimitReached",
            "The maximum number of informu accounts has been reached.",
            "error",
            undefined,
            true
        );
    }

    static FailedToCreateNewAccount(
        originatingError: unknown
    ): NewAccountFactoryException<"FailedToCreateNewAccount"> {
        return new this(
            "FailedToCreateNewAccount",
            "Failed to create a new account.",
            "error",
            originatingError,
            true
        );
    }

    static FailedToGetNewAccountNumber(): NewAccountFactoryException<
        "FailedToGetNewAccountNumber"
    > {
        return new this(
            "FailedToGetNewAccountNumber",
            "Failed to get a new account number.",
            "error",
            undefined,
            true
        );
    }

    static get MalformedData(): NewAccountFactoryException<"MalformedData"> {
        return new this(
            "MalformedData",
            "Received malformed data from the database.",
            "error",
            undefined,
            true
        );
    }
}

interface AccountIds {
    [key: string]: boolean;
}

function assertIsAccountIds(val: any): asserts val is AccountIds {
    if (typeof val !== "object") {
        throw NewAccountFactoryException.MalformedData;
    }
}

export default class NewAccountFactoryImpl implements NewAccountFactory {
    async create(
        uid: string,
        emailAddress: string,
        name: string
    ): Promise<Account> {
        try {
            const newAccountNumber = await this.getNewAccountNumber();
            return new Account({
                _accountNumber: newAccountNumber,
                _emailAddress: emailAddress,
                _muTags: new Set(),
                _name: name,
                _nextBeaconId: BeaconId.create("0"),
                _nextMuTagNumber: 0,
                _nextSafeZoneNumber: 0,
                _onboarding: true,
                _recycledBeaconIds: new Set(),
                _uid: uid
            });
        } catch (e) {
            if (NewAccountFactoryException.isType(e, "AccountLimitReached")) {
                throw e;
            }
            throw NewAccountFactoryException.FailedToCreateNewAccount(e);
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
        ): AccountIds | null | undefined => {
            if (currentData == null) {
                return currentData;
            }
            assertIsAccountIds(currentData);
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
                error = NewAccountFactoryException.AccountLimitReached;
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
            throw NewAccountFactoryException.FailedToGetNewAccountNumber;
        }
        return newAccountNumber;
    }
}
