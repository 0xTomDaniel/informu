import {
    AccountRepositoryRemote,
    FailedToGet,
    DoesNotExist,
    PersistedDataMalformed,
    FailedToAdd,
    FailedToRemove,
    FailedToUpdate
} from "../../Core/Ports/AccountRepositoryRemote";
import Account, {
    AccountJson,
    assertIsAccountJson
} from "../../Core/Domain/Account";
import database, {
    FirebaseDatabaseTypes
} from "@react-native-firebase/database";
import AccountRepositoryRemotePortAddMuTag from "../../../source (restructure)/useCases/addMuTag/AccountRepositoryRemotePort";
import AccountRepositoryRemotePortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/AccountRepositoryRemotePort";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

interface DatabaseAccount {
    readonly account_id: string;
    readonly badge_count: number;
    readonly email: string;
    readonly logged_in: string | null;
    readonly mu_tags: { [key: string]: boolean } | null;
    readonly name: string;
    readonly next_beacon_id: string;
    readonly next_mu_tag_number: number;
    readonly next_safe_zone_number: number;
    readonly onboarding: boolean;
    readonly recycled_beacon_ids: { [key: string]: boolean } | null;
}

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
            throw UserError.create(FailedToGet);
        }

        const accountData = AccountRepoRNFirebase.toAccountData(uid, snapshot);
        return Account.deserialize(accountData);
    }

    async add(account: Account): Promise<void> {
        const databaseAccount = AccountRepoRNFirebase.toDatabaseAccount(
            account.json
        );

        try {
            await database()
                .ref(`accounts/${account.uid}`)
                .set(databaseAccount);
        } catch (e) {
            console.warn(e);
            throw UserError.create(FailedToAdd);
        }
    }

    async update(account: Account): Promise<void> {
        const databaseAccount = AccountRepoRNFirebase.toDatabaseAccount(
            account.json
        );

        try {
            await database()
                .ref(`accounts/${account.uid}`)
                .update(databaseAccount);
        } catch (e) {
            console.warn(e);
            throw UserError.create(FailedToUpdate);
        }
    }

    async removeByUid(uid: string): Promise<void> {
        try {
            await database()
                .ref(`accounts/${uid}`)
                .remove();
        } catch (e) {
            console.warn(e);
            throw UserError.create(FailedToRemove);
        }
    }

    private static toDatabaseAccount(
        accountJson: AccountJson
    ): DatabaseAccount {
        const sessionId =
            accountJson._sessionId != null ? accountJson._sessionId : null;
        const muTags =
            accountJson._muTags != null
                ? accountJson._muTags.reduce((allMuTags, muTag) => {
                      allMuTags[muTag] = true;
                      return allMuTags;
                  }, {} as { [key: string]: boolean })
                : null;
        const recycledBeaconIds =
            accountJson._recycledBeaconIds != null
                ? accountJson._recycledBeaconIds.reduce(
                      (allBeaconIds, beaconId) => {
                          allBeaconIds[beaconId] = true;
                          return allBeaconIds;
                      },
                      {} as { [key: string]: boolean }
                  )
                : null;
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseAccount: DatabaseAccount = {
            account_id: accountJson._accountNumber,
            badge_count: 0,
            email: accountJson._emailAddress,
            logged_in: sessionId,
            mu_tags: muTags,
            name: accountJson._name,
            next_beacon_id: accountJson._nextBeaconId,
            next_mu_tag_number: accountJson._nextMuTagNumber,
            next_safe_zone_number: accountJson._nextSafeZoneNumber,
            onboarding: accountJson._onboarding,
            recycled_beacon_ids: recycledBeaconIds
        };
        /*eslint-enable */
        return databaseAccount;
    }

    private static toAccountData(
        uid: string,
        snapshot: FirebaseDatabaseTypes.DataSnapshot
    ): AccountJson {
        if (!snapshot.exists()) {
            throw UserError.create(DoesNotExist);
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== "object") {
            throw UserError.create(PersistedDataMalformed(uid));
        }

        const data: { [key: string]: any } = {
            _accountNumber: snapshotData.account_id,
            _emailAddress: snapshotData.email,
            _name: snapshotData.name,
            _nextBeaconId: snapshotData.next_beacon_id,
            _nextMuTagNumber: snapshotData.next_mu_tag_number,
            _nextSafeZoneNumber: snapshotData.next_safe_zone_number,
            _onboarding: snapshotData.onboarding,
            _uid: uid
        };

        if ("logged_in" in snapshotData) {
            data._sessionId = snapshotData.logged_in;
        }

        if ("mu_tags" in snapshotData) {
            data._muTags = Object.keys(snapshotData.mu_tags);
        }

        if ("recycled_beacon_ids" in snapshotData) {
            /*
             *  There is a problem casting 'snapshot.value as? [String : Bool]'
             *  when all of the keys are numbers. If at least one of the keys
             *  contain a string character then it works fine, however keys
             *  should always cast as a string no matter what. The workaround
             *  is to get the key value directly from the child DataSnapshot.
             *  These are always strings.
             */
            const recycledBeaconIdsSnapshot = snapshot.child(
                "recycled_beacon_ids"
            );
            const recycledBeaconIds: string[] = [];
            recycledBeaconIdsSnapshot.forEach(
                (beaconId: FirebaseDatabaseTypes.DataSnapshot) => {
                    if (!beaconId.exists() || beaconId.key == null) {
                        return;
                    }
                    recycledBeaconIds.push(beaconId.key);
                }
            );
            data._recycledBeaconIds = recycledBeaconIds;
        }

        try {
            assertIsAccountJson(data);
        } catch (e) {
            throw UserError.create(
                PersistedDataMalformed(JSON.stringify(data)),
                e
            );
        }

        return data;
    }
}
