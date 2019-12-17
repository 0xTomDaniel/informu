import { NewAccountFactory } from "../Ports/NewAccountFactory";
import Account, { AccountNumber } from "./Account";
import database from "@react-native-firebase/database";
import _ from "lodash";
import { BeaconID } from "./ProvisionedMuTag";

export class FailedToCreateNewAccount extends Error {
    constructor() {
        super("Failed to create a new Account. Please try again.");
        this.name = "FailedToCreateNewAccount";
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

interface AccountIDs {
    [key: string]: boolean;
}

export default class NewAccountFactoryImpl implements NewAccountFactory {
    async create(uid: string, emailAddress: string): Promise<Account> {
        try {
            const newAccountNumber = await this.getNewAccountNumber();
            return new Account({
                _uid: uid,
                _accountNumber: newAccountNumber,
                _emailAddress: emailAddress,
                _nextBeaconID: BeaconID.create("0"),
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
        return (
            (await this.getRecycledAccountNumber()) ??
            (await this.getNextAccountNumber())
        );
    }

    private async getRecycledAccountNumber(): Promise<
        AccountNumber | undefined
    > {
        let newAccountNumber: AccountNumber | undefined;

        const transactionUpdate = (
            currentData?: AccountIDs
        ): AccountIDs | undefined => {
            if (currentData == null) {
                return;
            }
            const recycledAccountIDs = _.toPairs(currentData);
            const newAccountNumberHex = recycledAccountIDs.shift()?.[0];
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
        return new Promise((resolve, reject) => {
            let newAccountNumber: AccountNumber;

            const transactionUpdate = (
                currentData?: string
            ): string | undefined => {
                try {
                    if (currentData == null) {
                        newAccountNumber = AccountNumber.fromString("0000000");
                        return "0000001";
                    }
                    if (currentData === "FFFFFFF") {
                        throw new AccountLimitReached();
                    }
                    newAccountNumber = AccountNumber.fromString(currentData);
                    return AccountNumber.increment(newAccountNumber).toString();
                } catch (e) {
                    reject(e);
                    return;
                }
            };

            return database()
                .ref("next_account_id")
                .transaction(transactionUpdate)
                .then((result): void => {
                    if (result.committed) {
                        resolve(newAccountNumber);
                    }
                });
        });
    }
}
