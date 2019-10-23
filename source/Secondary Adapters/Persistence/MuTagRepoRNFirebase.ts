import firebase, { App } from 'react-native-firebase';
import { Database, DataSnapshot } from 'react-native-firebase/database';
import { MuTagRepositoryRemote, FailedToAdd, FailedToUpdate, FailedToGet, DoesNotExist, PersistedDataMalformed } from '../../Core/Ports/MuTagRepositoryRemote';
import ProvisionedMuTag, { MuTagData, isMuTagData } from '../../Core/Domain/ProvisionedMuTag';

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
            const muTagData = MuTagRepoRNFirebase.toMuTagData(muTagUID, childSnapshot);
            muTags.add(ProvisionedMuTag.deserialize(muTagData));
            return true;
        });

        // DEBUG
        console.log(muTags);

        return muTags;
    }

    async add(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const muTagData = muTag.getMuTagData();

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: {[key: string]: any} = {
            beacon_id: muTagData.beaconID,
            mu_tag_number: muTagData.muTagNumber,
            attached_to: muTagData.name,
            batteryPercentage: muTagData.batteryLevel,
            color: muTagData.color,
        };
        /*eslint-enable */

        try {
            await this.database.ref(`mu_tags/${accountUID}/${muTagData.uid}`)
                .set(databaseData);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async update(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const muTagData = muTag.getMuTagData();

        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseData: {[key: string]: any} = {
            beacon_id: muTagData.beaconID,
            mu_tag_number: muTagData.muTagNumber,
            attached_to: muTagData.name,
            battery_percentage: muTagData.batteryLevel,
            last_seen: muTagData.lastSeen,
            color: muTagData.color,
        };
        /*eslint-enable */

        try {
            await this.database.ref(`mu_tags/${accountUID}/${muTagData.uid}`)
                .update(databaseData);
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

    private static toMuTagData(uid: string, snapshot: DataSnapshot): MuTagData {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== 'object') {
            throw new PersistedDataMalformed(uid);
        }

        const data: {[key: string]: any} = {
            uid: uid,
            beaconID: snapshotData.beacon_id,
            muTagNumber: snapshotData.mu_tag_number,
            name: snapshotData.attached_to,
            batteryLevel: snapshotData.battery_percentage,
            color: snapshotData.color,
            isSafe: true,
            lastSeen: snapshotData.last_seen,
        };

        if (!isMuTagData(data)) {
            throw new PersistedDataMalformed(JSON.stringify(data));
        }

        return data;
    }
}
