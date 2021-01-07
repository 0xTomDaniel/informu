import {
    AccountRepositoryLocal,
    AccountRepositoryLocalException
} from "../../Core/Ports/AccountRepositoryLocal";
import Account from "../../Core/Domain/Account";
import { Database } from "./Database";
import AccountRepositoryLocalPortAddMuTag from "../../../source (restructure)/useCases/addMuTag/AccountRepositoryLocalPort";
import AccountRepositoryLocalPortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/AccountRepositoryLocalPort";
import { defer } from "rxjs";
import { share, map } from "rxjs/operators";

export default class AccountRepoLocalImpl
    implements
        AccountRepositoryLocal,
        AccountRepositoryLocalPortAddMuTag,
        AccountRepositoryLocalPortRemoveMuTag {
    private readonly database: Database;
    private cachedAccount?: Account;
    private persistedAccount = defer(() => {
        return this.database.get("account");
    }).pipe(
        map(rawAccount => {
            if (typeof rawAccount === "string") {
                return Account.deserialize(rawAccount);
            }
        }),
        share()
    );

    constructor(database: Database) {
        this.database = database;
    }

    async get(): Promise<Account> {
        if (this.cachedAccount != null) {
            return this.cachedAccount;
        }
        let account: Account | undefined;
        try {
            account = await this.persistedAccount.toPromise();
        } catch (e) {
            console.log(e);
            throw AccountRepositoryLocalException.FailedToGet;
        }
        if (account == null) {
            throw AccountRepositoryLocalException.DoesNotExist;
        }
        this.cachedAccount = account;
        return account;
    }

    async add(account: Account): Promise<void> {
        const rawAccount = account.serialize();
        try {
            await this.database.set("account", rawAccount);
        } catch (e) {
            console.log(e);
            throw AccountRepositoryLocalException.FailedToAdd;
        }
        this.cachedAccount = account;
    }

    async update(account: Account): Promise<void> {
        const rawAccount = account.serialize();
        try {
            await this.database.set("account", rawAccount);
        } catch (e) {
            console.log(e);
            throw AccountRepositoryLocalException.FailedToUpdate;
        }
    }

    async remove(): Promise<void> {
        try {
            await this.database.remove("account");
            this.cachedAccount = undefined;
        } catch (e) {
            console.log(e);
            throw AccountRepositoryLocalException.FailedToRemove;
        }
    }
}
