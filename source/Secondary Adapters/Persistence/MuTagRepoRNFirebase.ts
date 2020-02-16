import database, {
    FirebaseDatabaseTypes
} from "@react-native-firebase/database";
import {
    MuTagRepositoryRemote,
    FailedToAdd,
    FailedToUpdate,
    FailedToGet,
    DoesNotExist,
    PersistedDataMalformed,
    FailedToRemove
} from "../../Core/Ports/MuTagRepositoryRemote";
import ProvisionedMuTag, {
    MuTagJSON,
    isMuTagJSON
} from "../../Core/Domain/ProvisionedMuTag";
import { v4 as uuidV4 } from "uuid";
import MuTagRepositoryRemotePortAddMuTag from "../../../source (restructure)/useCases/addMuTag/MuTagRepositoryRemotePort";
import MuTagRepositoryRemotePortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/MuTagRepositoryRemotePort";

interface DatabaseMuTag {
    beacon_id: string;
    mu_tag_number: number;
    attached_to: string;
    battery_percentage: number;
    last_seen: string;
    color: number;
}

export class MuTagRepoRNFirebase
    implements
        MuTagRepositoryRemote,
        MuTagRepositoryRemotePortAddMuTag,
        MuTagRepositoryRemotePortRemoveMuTag {
    async getAll(accountUID: string): Promise<Set<ProvisionedMuTag>> {
        let snapshot: FirebaseDatabaseTypes.DataSnapshot;

        try {
            snapshot = await database()
                .ref(`mu_tags/${accountUID}`)
                .once("value");
        } catch (e) {
            console.warn(e);
            throw new FailedToGet();
        }

        const muTags = new Set<ProvisionedMuTag>();

        snapshot.forEach(
            (childSnapshot: FirebaseDatabaseTypes.DataSnapshot): boolean => {
                const muTagUID = childSnapshot.key;
                if (muTagUID == null) {
                    return false;
                }
                const muTagData = MuTagRepoRNFirebase.toMuTagJSON(
                    muTagUID,
                    childSnapshot
                );
                muTags.add(ProvisionedMuTag.deserialize(muTagData));
                return false;
            }
        );

        return muTags;
    }

    async add(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(muTag);

        try {
            await database()
                .ref(`mu_tags/${accountUID}/${muTag.uid}`)
                .set(databaseMuTag);
        } catch (e) {
            console.warn(e);
            throw new FailedToAdd();
        }
    }

    async update(muTag: ProvisionedMuTag, accountUID: string): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(muTag);

        try {
            await database()
                .ref(`mu_tags/${accountUID}/${muTag.uid}`)
                .update(databaseMuTag);
        } catch (e) {
            console.warn(e);
            throw new FailedToUpdate();
        }
    }

    async updateMultiple(
        muTags: Set<ProvisionedMuTag>,
        accountUID: string
    ): Promise<void> {
        for (const muTag of muTags) {
            await this.update(muTag, accountUID);
        }
    }

    async removeByUid(uid: string, accountUID: string): Promise<void> {
        try {
            await database()
                .ref(`mu_tags/${accountUID}/${uid}`)
                .remove();
        } catch (e) {
            console.warn(e);
            throw new FailedToRemove();
        }
    }

    createNewUid(accountUID: string): string {
        return (
            database()
                .ref(`mu_tags/${accountUID}`)
                .push().key || uuidV4()
        );
    }

    private static toDatabaseMuTag(muTag: ProvisionedMuTag): DatabaseMuTag {
        const muTagJSON = muTag.json;
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseMuTag: DatabaseMuTag = {
            beacon_id: muTagJSON._beaconID,
            mu_tag_number: muTagJSON._muTagNumber,
            attached_to: muTagJSON._name,
            battery_percentage: muTagJSON._batteryLevel,
            last_seen: muTagJSON._lastSeen,
            color: muTagJSON._color
        };
        /*eslint-enable */
        return databaseMuTag;
    }

    private static toMuTagJSON(
        uid: string,
        snapshot: FirebaseDatabaseTypes.DataSnapshot
    ): MuTagJSON {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== "object") {
            throw new PersistedDataMalformed(uid);
        }

        const json: { [key: string]: any } = {
            _uid: uid,
            _beaconID: snapshotData.beacon_id,
            _muTagNumber: snapshotData.mu_tag_number,
            _name: snapshotData.attached_to,
            _batteryLevel: snapshotData.battery_percentage,
            _color: snapshotData.color,
            _isSafe: false,
            _lastSeen: snapshotData.last_seen
        };

        if (!isMuTagJSON(json)) {
            throw new PersistedDataMalformed(JSON.stringify(json));
        }

        return json;
    }
}
