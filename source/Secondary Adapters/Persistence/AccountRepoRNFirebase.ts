import {
    AccountRepositoryRemote,
    FailedToGet,
    DoesNotExist,
    PersistedDataMalformed,
    FailedToAdd,
    FailedToRemove,
    FailedToUpdate
} from "../../Core/Ports/AccountRepositoryRemote";
import Account, { AccountJSON, isAccountJSON } from "../../Core/Domain/Account";
import database, {
    FirebaseDatabaseTypes
} from "@react-native-firebase/database";
import AccountRepositoryRemotePortAddMuTag from "../../../source (restructure)/useCases/addMuTag/AccountRepositoryRemotePort";
import AccountRepositoryRemotePortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/AccountRepositoryRemotePort";

export class AccountRepoRNFirebase
    implements
        AccountRepositoryRemote,
        AccountRepositoryRemotePortAddMuTag,
        AccountRepositoryRemotePortRemoveMuTag {
    async getByUid(uid: string): Promise<Account> {
        let snapshot: FirebaseDatabaseTypes.DataSnapshot;

        try {
            snapshot = await database()
                .ref(`accounts/${uid}`)
                .once("value");
        } catch (e) {
            console.warn(e);
            throw new FailedToGet();
        }

        const accountData = AccountRepoRNFirebase.toAccountData(uid, snapshot);
        return Account.deserialize(accountData);
    }

    async add(account: Account): Promise<void> {
        const accountData = account.json;

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: { [key: string]: any } = {
            account_id: accountData._accountNumber,
            email: accountData._emailAddress,
            next_beacon_id: accountData._nextBeaconId,
            next_mu_tag_number: accountData._nextMuTagNumber
        };

        if (accountData._recycledBeaconIds != null) {
            databaseData.recycled_beacon_ids = accountData._recycledBeaconIds.map(
                (beaconId): object => ({ [beaconId]: true })
            );
        }

        if (accountData._muTags != null) {
            databaseData.mu_tags = accountData._muTags.map(
                (beaconId): object => ({ [beaconId]: true })
            );
        }
        /*eslint-enable */

        try {
            await database()
                .ref(`accounts/${accountData._uid}`)
                .set(databaseData);
        } catch (e) {
            console.warn(e);
            throw new FailedToAdd();
        }
    }

    async update(account: Account): Promise<void> {
        const accountData = account.json;

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: { [key: string]: any } = {
            account_id: accountData._accountNumber,
            email: accountData._emailAddress,
            next_beacon_id: accountData._nextBeaconId,
            next_mu_tag_number: accountData._nextMuTagNumber
        };

        if (accountData._recycledBeaconIds != null) {
            const initialValue: { [key: string]: any } = {};
            databaseData.recycled_beacon_ids = accountData._recycledBeaconIds.reduce(
                (allBeaconIds, beaconId): object => {
                    allBeaconIds[beaconId] = true;
                    return allBeaconIds;
                },
                initialValue
            );
        }

        if (accountData._muTags != null) {
            const initialValue: { [key: string]: any } = {};
            databaseData.mu_tags = accountData._muTags.reduce(
                (allMuTags, beaconId): object => {
                    allMuTags[beaconId] = true;
                    return allMuTags;
                },
                initialValue
            );
        }
        /*eslint-enable */

        try {
            await database()
                .ref(`accounts/${accountData._uid}`)
                .update(databaseData);
        } catch (e) {
            console.warn(e);
            throw new FailedToUpdate();
        }
    }

    async removeByUid(uid: string): Promise<void> {
        try {
            await database()
                .ref(`accounts/${uid}`)
                .remove();
        } catch (e) {
            console.warn(e);
            throw new FailedToRemove();
        }
    }

    private static toAccountData(
        uid: string,
        snapshot: FirebaseDatabaseTypes.DataSnapshot
    ): AccountJSON {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== "object") {
            throw new PersistedDataMalformed(uid);
        }

        const data: { [key: string]: any } = {
            _uid: uid,
            _accountNumber: snapshotData.account_id,
            _emailAddress: snapshotData.email,
            _nextBeaconId: snapshotData.next_beacon_id,
            _nextMuTagNumber: snapshotData.next_mu_tag_number
        };

        if ("recycled_beacon_ids" in snapshotData) {
            data._recycledBeaconIds = Object.keys(
                snapshotData.recycled_beacon_ids
            );
        }

        if ("mu_tags" in snapshotData) {
            data._muTags = Object.keys(snapshotData.mu_tags);
        }

        if (!isAccountJSON(data)) {
            throw new PersistedDataMalformed(JSON.stringify(data));
        }

        return data;
    }
}
