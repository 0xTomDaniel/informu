import {
    AccountRepositoryRemote,
    FailedToGet,
    DoesNotExist,
    PersistedDataMalformed,
    FailedToAdd,
    FailedToRemove,
    FailedToUpdate,
} from '../../Core/Ports/AccountRepositoryRemote';
import Account, { AccountJSON, isAccountJSON } from '../../Core/Domain/Account';
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
        const accountData = account.json;

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: {[key: string]: any} = {
            account_id: accountData._accountNumber,
            email: accountData._emailAddress,
            next_beacon_id: accountData._nextBeaconID,
            next_mu_tag_number: accountData._nextMuTagNumber,
        };

        if (accountData._recycledBeaconIDs != null) {
            databaseData.recycled_beacon_ids = accountData._recycledBeaconIDs.map(
                (beaconID): object => ( { [beaconID]: true } )
            );
        }

        if (accountData._muTags != null) {
            databaseData.mu_tags = accountData._muTags.map(
                (beaconID): object => ( { [beaconID]: true } )
            );
        }
        /*eslint-enable */

        try {
            await this.database.ref(`accounts/${accountData._uid}`).set(databaseData);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(account: Account): Promise<void> {
        const accountData = account.json;

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: {[key: string]: any} = {
            account_id: accountData._accountNumber,
            email: accountData._emailAddress,
            next_beacon_id: accountData._nextBeaconID,
            next_mu_tag_number: accountData._nextMuTagNumber,
        };

        if (accountData._recycledBeaconIDs != null) {
            const initialValue: { [key: string]: any } = {};
            databaseData.recycled_beacon_ids = accountData._recycledBeaconIDs
                .reduce((allBeaconIDs, beaconID): object => {
                    allBeaconIDs[beaconID] = true;
                    return allBeaconIDs;
                }, initialValue);
        }

        if (accountData._muTags != null) {
            const initialValue: { [key: string]: any } = {};
            databaseData.mu_tags = accountData._muTags
                .reduce((allMuTags, beaconID): object => {
                    allMuTags[beaconID] = true;
                    return allMuTags;
                }, initialValue);
        }
        /*eslint-enable */

        try {
            await this.database.ref(`accounts/${accountData._uid}`).update(databaseData);
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

    private static toAccountData(uid: string, snapshot: DataSnapshot): AccountJSON {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== 'object') {
            throw new PersistedDataMalformed(uid);
        }

        const data: {[key: string]: any} = {
            uid: uid,
            accountNumber: snapshotData.account_id,
            emailAddress: snapshotData.email,
            nextBeaconID: snapshotData.next_beacon_id,
            nextMuTagNumber: snapshotData.next_mu_tag_number,
        };

        if (snapshotData.hasOwnProperty('recycled_beacon_ids')) {
            data.recycledBeaconIDs = Object.keys(snapshotData.recycled_beacon_ids);
        }

        if (snapshotData.hasOwnProperty('mu_tags')) {
            data.muTags = Object.keys(snapshotData.mu_tags);
        }

        if (!isAccountJSON(data)) {
            throw new PersistedDataMalformed(JSON.stringify(data));
        }

        return data;
    }
}
