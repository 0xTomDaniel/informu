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
    MuTagJson,
    assertIsMuTagJson,
    BeaconId
} from "../../Core/Domain/ProvisionedMuTag";
import { v4 as uuidV4 } from "uuid";
import MuTagRepositoryRemotePortAddMuTag from "../../../source (restructure)/useCases/addMuTag/MuTagRepositoryRemotePort";
import MuTagRepositoryRemotePortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/MuTagRepositoryRemotePort";
import MuTagDevices from "../../../source (restructure)/shared/muTagDevices/MuTagDevices";
import { AccountNumber } from "../../Core/Domain/Account";

interface DatabaseMuTag {
    readonly advertising_interval: number;
    readonly attached_to: string;
    readonly battery_percentage: number;
    readonly beacon_id: string;
    readonly color: number;
    readonly date_added: string;
    readonly did_exit_region: boolean;
    readonly firmware_version: string;
    readonly in_safe_zone: number;
    readonly is_checked_in: boolean;
    readonly is_disabled: boolean;
    readonly is_expensive: boolean;
    readonly is_irreplaceable: boolean;
    readonly is_missing: boolean;
    readonly is_picking_up: boolean;
    readonly last_seen: string;
    readonly mac_address: string;
    readonly major: string;
    readonly minor: string;
    readonly model_number: string;
    readonly mu_tag_number: number;
    readonly recent_latitude: number;
    readonly recent_longitude: number;
    readonly tx_power: number;
}

export class MuTagRepoRNFirebase
    implements
        MuTagRepositoryRemote,
        MuTagRepositoryRemotePortAddMuTag,
        MuTagRepositoryRemotePortRemoveMuTag {
    async getAll(accountUid: string): Promise<Set<ProvisionedMuTag>> {
        let snapshot: FirebaseDatabaseTypes.DataSnapshot;

        try {
            snapshot = await database()
                .ref(`mu_tags/${accountUid}`)
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
                const muTagData = MuTagRepoRNFirebase.toMuTagJson(
                    muTagUID,
                    childSnapshot
                );
                muTags.add(ProvisionedMuTag.deserialize(muTagData));
                return false;
            }
        );

        return muTags;
    }

    async add(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(
            muTag.json,
            accountNumber
        );

        try {
            await database()
                .ref(`mu_tags/${accountUid}/${muTag.uid}`)
                .set(databaseMuTag);
        } catch (e) {
            console.warn(e);
            throw new FailedToAdd();
        }
    }

    async update(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void> {
        const databaseMuTag = MuTagRepoRNFirebase.toDatabaseMuTag(
            muTag.json,
            accountNumber
        );

        try {
            await database()
                .ref(`mu_tags/${accountUid}/${muTag.uid}`)
                .update(databaseMuTag);
        } catch (e) {
            console.warn(e);
            throw new FailedToUpdate();
        }
    }

    async updateMultiple(
        muTags: Set<ProvisionedMuTag>,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void> {
        for (const muTag of muTags) {
            await this.update(muTag, accountUid, accountNumber);
        }
    }

    async removeByUid(uid: string, accountUid: string): Promise<void> {
        try {
            await database()
                .ref(`mu_tags/${accountUid}/${uid}`)
                .remove();
        } catch (e) {
            console.warn(e);
            throw new FailedToRemove();
        }
    }

    createNewUid(accountUid: string): string {
        return (
            database()
                .ref(`mu_tags/${accountUid}`)
                .push().key || uuidV4()
        );
    }

    private static toDatabaseMuTag(
        muTagJson: MuTagJson,
        accountNumber: AccountNumber
    ): DatabaseMuTag {
        /*eslint-disable @typescript-eslint/camelcase*/
        const databaseMuTag: DatabaseMuTag = {
            advertising_interval: muTagJson._advertisingInterval,
            attached_to: muTagJson._name,
            battery_percentage: muTagJson._batteryLevel,
            beacon_id: muTagJson._beaconId,
            color: muTagJson._color,
            date_added: muTagJson._dateAdded,
            did_exit_region: muTagJson._didExitRegion,
            firmware_version: muTagJson._firmwareVersion,
            in_safe_zone: -1,
            is_checked_in: false,
            is_disabled: false,
            is_expensive: false,
            is_irreplaceable: false,
            is_missing: false,
            is_picking_up: false,
            last_seen: muTagJson._lastSeen,
            mac_address: muTagJson._macAddress,
            major: MuTagDevices.getMajor(accountNumber).toString(),
            minor: MuTagDevices.getMinor(
                accountNumber,
                BeaconId.fromString(muTagJson._beaconId)
            ).toString(),
            model_number: muTagJson._modelNumber,
            mu_tag_number: muTagJson._muTagNumber,
            recent_latitude: muTagJson._recentLatitude,
            recent_longitude: muTagJson._recentLongitude,
            tx_power: muTagJson._txPower
        };
        /*eslint-enable */
        return databaseMuTag;
    }

    private static toMuTagJson(
        uid: string,
        snapshot: FirebaseDatabaseTypes.DataSnapshot
    ): MuTagJson {
        if (!snapshot.exists()) {
            throw new DoesNotExist();
        }

        const snapshotData = snapshot.val();
        if (typeof snapshotData !== "object") {
            throw new PersistedDataMalformed(uid);
        }

        const json: { [key: string]: any } = {
            _advertisingInterval: snapshotData.advertising_interval,
            _batteryLevel: snapshotData.battery_percentage,
            _beaconId: snapshotData.beacon_id,
            _color: snapshotData.color,
            _dateAdded: snapshotData.date_added,
            _didExitRegion: snapshotData.did_exit_region,
            _firmwareVersion: snapshotData.firmware_version,
            _isSafe: false,
            _lastSeen: snapshotData.last_seen,
            _macAddress: snapshotData.mac_address,
            _modelNumber: snapshotData.model_number,
            _muTagNumber: snapshotData.mu_tag_number,
            _name: snapshotData.attached_to,
            _recentLatitude: snapshotData.recent_latitude,
            _recentLongitude: snapshotData.recent_longitude,
            _txPower: snapshotData.tx_power,
            _uid: uid
        };

        try {
            assertIsMuTagJson(json);
        } catch (e) {
            console.warn(e);
            throw new PersistedDataMalformed(JSON.stringify(json));
        }

        return json;
    }
}
