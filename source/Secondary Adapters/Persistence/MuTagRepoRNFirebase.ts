import firebase, { App } from 'react-native-firebase';
import { Database, DataSnapshot } from 'react-native-firebase/database';
import { MuTagRepositoryRemote, FailedToAdd, FailedToUpdate } from '../../Core/Ports/MuTagRepositoryRemote';
import ProvisionedMuTag from '../../Core/Domain/ProvisionedMuTag';

export class MuTagRepoRNFirebase implements MuTagRepositoryRemote {

    private readonly database: Database;

    constructor(app?: App) {
        if (app != null) {
            this.database = app.database();
        } else {
            this.database = firebase.database();
        }
    }

    /*async getByUID(uid: string): Promise<MuTag> {
        let snapshot: DataSnapshot;

        try {
            snapshot = await this.database.ref(`muTags/${uid}`).once('value');
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        const muTagData = MuTagRepoRNFirebase.toMuTagData(uid, snapshot);
        return MuTag.deserialize(muTagData);
    }*/

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
            batteryPercentage: muTagData.batteryLevel,
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
    }

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
            muTagNumber: snapshotData.muTag_id,
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

        if (!isMuTagData(data)) {
            throw new PersistedDataMalformed(JSON.stringify(data));
        }

        return data;
    }*/
}
