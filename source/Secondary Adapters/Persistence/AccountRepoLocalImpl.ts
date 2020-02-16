import {
    AccountRepositoryLocal,
    FailedToAdd,
    FailedToGet,
    DoesNotExist,
    FailedToRemove,
    FailedToUpdate
} from "../../Core/Ports/AccountRepositoryLocal";
import Account from "../../Core/Domain/Account";
import { Database } from "./Database";
import AccountRepositoryLocalPort from "../../../source (restructure)/useCases/addMuTag/AccountRepositoryLocalPort";

export default class AccountRepoLocalImpl
    implements AccountRepositoryLocal, AccountRepositoryLocalPort {
    private readonly database: Database;
    private account?: Account;

    constructor(database: Database) {
        this.database = database;
    }

    async get(): Promise<Account> {
        if (this.account != null) {
            return this.account;
        }

        let rawAccount: string | undefined;

        try {
            rawAccount = await this.database.get("account");
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        if (typeof rawAccount !== "string") {
            throw new DoesNotExist();
        }

        const account = Account.deserialize(rawAccount);
        this.account = account;
        return account;
    }

    async add(account: Account): Promise<void> {
        const rawAccount = account.serialize();

        try {
            await this.database.set("account", rawAccount);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(account: Account): Promise<void> {
        const rawAccount = account.serialize();

        try {
            await this.database.set("account", rawAccount);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
        }
    }

    async remove(): Promise<void> {
        try {
            await this.database.remove("account");
            this.account = undefined;
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }
}
