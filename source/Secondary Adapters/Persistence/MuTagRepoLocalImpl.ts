import {
    MuTagRepositoryLocal,
    FailedToAdd,
    FailedToRemove,
    FailedToUpdate,
    DoesNotExist as MuTagDoesNotExist
} from "../../Core/Ports/MuTagRepositoryLocal";
import ProvisionedMuTag, { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import { AccountRepositoryLocal } from "../../Core/Ports/AccountRepositoryLocal";
import { Database } from "./Database";
import MuTagRepositoryLocalPortAddMuTag from "../../../source (restructure)/useCases/addMuTag/MuTagRepositoryLocalPort";
import MuTagRepositoryLocalPortRemoveMuTag from "../../../source (restructure)/useCases/removeMuTag/MuTagRepositoryLocalPort";
import { defer } from "rxjs";
import { publish, refCount } from "rxjs/operators";
import MuTagRepositoryLocalPortUpdateBelongingsLocation from "../../../source (restructure)/useCases/updateBelongingsLocation/MuTagRepositoryLocalPort";
import MuTagRepositoryLocalPortViewBelongingMap from "../../../source (restructure)/useCases/viewBelongingMap/MuTagRepositoryLocalPort";
import MuTagRepositoryLocalPortUpdateMuTagBatteries from "../../../source (restructure)/useCases/updateMuTagBatteries/MuTagRepositoryLocalPort";

interface PromiseExecutor {
    resolve: (value?: void | PromiseLike<void> | undefined) => void;
    reject: (reason?: any) => void;
}

export default class MuTagRepoLocalImpl
    implements
        MuTagRepositoryLocal,
        MuTagRepositoryLocalPortAddMuTag,
        MuTagRepositoryLocalPortRemoveMuTag,
        MuTagRepositoryLocalPortUpdateBelongingsLocation,
        MuTagRepositoryLocalPortViewBelongingMap,
        MuTagRepositoryLocalPortUpdateMuTagBatteries {
    private readonly database: Database;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly muTagCache = new Map<string, ProvisionedMuTag>();
    private readonly muTagBeaconIdToUidCache = new Map<string, string>();
    private persistedMuTags = defer(() => this.getAllMuTagsFromDatabase()).pipe(
        publish(),
        refCount()
    );

    constructor(database: Database, accountRepoLocal: AccountRepositoryLocal) {
        this.database = database;
        this.accountRepoLocal = accountRepoLocal;
    }

    async getByUid(uid: string): Promise<ProvisionedMuTag> {
        await this.waitForCacheToPopulate();
        if (this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new MuTagDoesNotExist(uid);
        }
    }

    async getByBeaconId(beaconId: BeaconId): Promise<ProvisionedMuTag> {
        await this.waitForCacheToPopulate();
        const uid = this.muTagBeaconIdToUidCache.get(beaconId.toString());
        if (uid != null && this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new MuTagDoesNotExist(beaconId.toString());
        }
    }

    async getAll(): Promise<Set<ProvisionedMuTag>> {
        await this.waitForCacheToPopulate();
        return new Set(this.muTagCache.values());
    }

    async add(muTag: ProvisionedMuTag): Promise<void> {
        const rawMuTag = muTag.serialize();
        try {
            await this.database.set(`muTags/${muTag.uid}`, rawMuTag);
            this.muTagCache?.set(muTag.uid, muTag);
            this.muTagBeaconIdToUidCache.set(
                muTag.beaconId.toString(),
                muTag.uid
            );
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
        }
    }

    async addMultiple(muTags: Set<ProvisionedMuTag>): Promise<void> {
        for (const muTag of muTags) {
            await this.add(muTag);
        }
    }

    async update(muTag: ProvisionedMuTag): Promise<void> {
        const rawMuTag = muTag.serialize();
        try {
            await this.database.set(`muTags/${muTag.uid}`, rawMuTag);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
        }
    }

    async removeByUid(uid: string): Promise<void> {
        try {
            await this.database.remove(`muTags/${uid}`);
            this.muTagCache.delete(uid);
            const beaconIds = [...this.muTagBeaconIdToUidCache]
                .filter(({ 1: value }): boolean => value === uid)
                .map(([key]): string => key);
            beaconIds.forEach((key): void => {
                this.muTagBeaconIdToUidCache.delete(key);
            });
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }

    private async waitForCacheToPopulate(): Promise<void> {
        return new Promise((resolve, reject) =>
            this.persistedMuTags.subscribe(
                muTags => {
                    muTags.forEach(muTag => {
                        this.muTagCache.set(muTag.uid, muTag);
                        this.muTagBeaconIdToUidCache.set(
                            muTag.beaconId.toString(),
                            muTag.uid
                        );
                    });
                    resolve();
                },
                error => reject(error),
                () => resolve()
            )
        );
    }

    private async getAllMuTagsFromDatabase(): Promise<Set<ProvisionedMuTag>> {
        const account = await this.accountRepoLocal.get();
        const muTags = new Set<ProvisionedMuTag>();
        for (const muTagUid of account.muTags) {
            if (this.muTagCache.has(muTagUid)) {
                continue;
            }
            const rawMuTag = await this.database.get(`muTags/${muTagUid}`);
            if (rawMuTag == null) {
                throw new MuTagDoesNotExist(muTagUid);
            }
            muTags.add(ProvisionedMuTag.deserialize(rawMuTag));
        }
        return muTags;
    }
}
