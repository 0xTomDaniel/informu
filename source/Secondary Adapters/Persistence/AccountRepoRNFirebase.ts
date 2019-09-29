import {
    AccountRepositoryRemote,
    FailedToGet,
    DoesNotExist,
    PersistedDataMalformed,
    FailedToAdd,
    FailedToRemove,
    FailedToUpdate,
} from '../../Core/Ports/AccountRepositoryRemote';
import Account, { AccountData } from '../../Core/Domain/Account';
import firebase, { App } from 'react-native-firebase';
import { Database, DataSnapshot } from 'react-native-firebase/database';

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
        let snapshot: DataSnapshot;

        try {
            snapshot = await this.database.ref(`accounts/${uid}`).once('value');
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        const accountData = AccountRepoRNFirebase.toAccountData(uid, snapshot);
        return Account.deserialize(accountData);
    }

    async add(account: Account): Promise<void> {
        const accountData = account.getAccountData();
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData = {
            account_id: accountData.accountNumber,
            email: accountData.emailAddress,
            next_beacon_id: accountData.nextBeaconID,
            recycled_beacon_ids: accountData.recycledBeaconIDs.map(
                (beaconID): object => { return { [beaconID]: true }; }
            ),
            next_mu_tag_number: accountData.nextMuTagNumber,
            mu_tags: accountData.muTags.map(
                (muTag): object => { return { [muTag]: true }; }
            ),
        };
        /*eslint-enable */
        try {
            await this.database.ref(`accounts/${accountData.uid}`).set(databaseData);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(account: Account): Promise<void> {
        const accountData = account.getAccountData();
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData = {
            account_id: accountData.accountNumber,
            email: accountData.emailAddress,
            next_beacon_id: accountData.nextBeaconID,
            recycled_beacon_ids: accountData.recycledBeaconIDs.map(
                (beaconID): object => { return { [beaconID]: true }; }
            ),
            next_mu_tag_number: accountData.nextMuTagNumber,
            mu_tags: accountData.muTags.map(
                (muTag): object => { return { [muTag]: true }; }
            ),
        };
        /*eslint-enable */
        try {
            await this.database.ref(`accounts/${accountData.uid}`).update(databaseData);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
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

    private static toAccountData(uid: string, snapshot: DataSnapshot): AccountData {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const data = snapshot.val();
        if (typeof data !== 'object') {
            throw new PersistedDataMalformed(uid);
        }

        const accountData: AccountData = {
            uid: uid,
            accountNumber: this.getValueForKey(data, 'account_id'),
            emailAddress: this.getValueForKey(data, 'email'),
            nextBeaconID: this.getValueForKey(data, 'next_beacon_id'),
            recycledBeaconIDs:
                Object.keys(this.getValueForKey(data, 'recycled_beacon_ids')),
            nextMuTagNumber: this.getValueForKey(data, 'next_mu_tag_number'),
            muTags:
                Object.keys(this.getValueForKey(data, 'mu_tags')),
        };
        return accountData;
    }

    private static getValueForKey(data: object, key: string): any {
        const object = data as { [key: string]: any };

        if (!object.hasOwnProperty(key)) {
            throw new PersistedDataMalformed(key);
        }

        return object[key];
    }
}
