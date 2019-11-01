import firebase, { App } from 'react-native-firebase';
import { Database, DataSnapshot } from 'react-native-firebase/database';
import { MuTagRepositoryRemote, FailedToAdd, FailedToUpdate, FailedToGet, DoesNotExist, PersistedDataMalformed } from '../../Core/Ports/MuTagRepositoryRemote';
import ProvisionedMuTag, { MuTagJSON, isMuTagJSON } from '../../Core/Domain/ProvisionedMuTag';

interface DatabaseMuTag {
    beacon_id: string;
    mu_tag_number: number;
    attached_to: string;
    battery_percentage: number;
    last_seen: string;
    color: number;
}

export class MuTagRepoRNFirebase implements MuTagRepositoryRemote {

    private readonly database: Database;

    constructor(app?: App) {
        if (app != null) {
            this.database = app.database();
        } else {
            this.database = firebase.database();
        }
    }

    async getAll(accountUID: string): Promise<Set<ProvisionedMuTag>> {
        let snapshot: DataSnapshot;

        try {
            snapshot = await this.database.ref(`mu_tags/${accountUID}`).once('value');
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        const muTags = new Set<ProvisionedMuTag>();

        snapshot.forEach((childSnapshot): boolean => {
            const muTagUID = childSnapshot.key;
            if (muTagUID == null) {
                return true;
            }
            const muTagData = MuTagRepoRNFirebase.toMuTagJSON(muTagUID, childSnapshot);
            muTags.add(ProvisionedMuTag.deserialize(muTagData));
            return true;
        });

        return muTags;
    }

    async add(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(muTag);

        try {
            await this.database.ref(`mu_tags/${accountUID}/${muTag.uid}`)
                .set(databaseMuTag);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(muTag);

        try {
            await this.database.ref(`mu_tags/${accountUID}/${muTag.uid}`)
                .update(databaseMuTag);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
        }
    }

    async updateMultiple(muTags: Set<ProvisionedMuTag>, accountUID: string): Promise<void> {
        for (const muTag of muTags) {
            await this.update(muTag, accountUID);
        }
    }

    /*async removeByUID(uid: string): Promise<void> {
        try {
            await this.database.ref(`muTags/${uid}`).remove();
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }*/

    private static toDatabaseMuTag(muTag: ProvisionedMuTag): DatabaseMuTag {
        const muTagJSON = muTag.json;
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseMuTag: DatabaseMuTag = {
            beacon_id: muTagJSON._beaconID,
            mu_tag_number: muTagJSON._muTagNumber,
            attached_to: muTagJSON._name,
            battery_percentage: muTagJSON._batteryLevel,
            last_seen: muTagJSON._lastSeen,
            color: muTagJSON._color,
        };
        /*eslint-enable */
        return databaseMuTag;
    }

    private static toMuTagJSON(uid: string, snapshot: DataSnapshot): MuTagJSON {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== 'object') {
            throw new PersistedDataMalformed(uid);
        }

        const json: {[key: string]: any} = {
            _uid: uid,
            _beaconID: snapshotData.beacon_id,
            _muTagNumber: snapshotData.mu_tag_number,
            _name: snapshotData.attached_to,
            _batteryLevel: snapshotData.battery_percentage,
            _color: snapshotData.color,
            _isSafe: true,
            _lastSeen: snapshotData.last_seen,
        };

        if (!isMuTagJSON(json)) {
            throw new PersistedDataMalformed(JSON.stringify(json));
        }

        return json;
    }
}
