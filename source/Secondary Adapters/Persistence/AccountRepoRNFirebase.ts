import { AccountRepositoryRemote, AccountData, FailedToGet, DoesNotExist, PersistedDataMalformed, FailedToAdd, FailedToRemove } from '../../Core/Ports/AccountRepositoryRemote';
import { Account } from '../../Core/Domain/Account';
import firebase, { App } from 'react-native-firebase';
import { Database } from 'react-native-firebase/database';

export class AccountRepoRNFirebase implements AccountRepositoryRemote {

    private readonly database: Database;

    constructor(app?: App) {
        if (app != null) {
            this.database = app.database();
        } else {
            this.database = firebase.database();
        }
    }

    async getByUID(uid: string): Promise<Account> {
        let value: any;

        try {
            const snapshot = await this.database.ref(`accounts/${uid}`).once('value');
            value = snapshot.val();
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        if (value == null) {
            throw new DoesNotExist();
        }

        if (this.isAccountData(value)) {
            return new Account(uid, value.emailAddress);
        } else {
            throw new PersistedDataMalformed();
        }
    }

    async add(account: Account): Promise<void> {
        try {
            await this.database.ref(`accounts/${account.uid}/email`)
                .set(account.emailAddress);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async removeByUID(uid: string): Promise<void> {
        try {
            await this.database.ref(`accounts/${uid}`).remove();
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }

    private isAccountData(arg: any): arg is AccountData {
        return (arg as AccountData).emailAddress !== undefined;
    }
}
