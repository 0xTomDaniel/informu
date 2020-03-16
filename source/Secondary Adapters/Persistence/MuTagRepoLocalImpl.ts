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

interface PromiseExecutor {
    resolve: (value?: void | PromiseLike<void> | undefined) => void;
    reject: (reason?: any) => void;
}

enum CacheStatus {
    Populated,
    Unpopulated,
    Populating,
    PopulationFailed
}

export default class MuTagRepoLocalImpl
    implements
        MuTagRepositoryLocal,
        MuTagRepositoryLocalPortAddMuTag,
        MuTagRepositoryLocalPortRemoveMuTag {
    private readonly database: Database;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly muTagCache = new Map<string, ProvisionedMuTag>();
    private readonly muTagBeaconIdToUIDCache = new Map<string, string>();
    private cacheStatus = CacheStatus.Unpopulated;
    private readonly executeOnCachePopulated: PromiseExecutor[] = [];

    constructor(database: Database, accountRepoLocal: AccountRepositoryLocal) {
        this.database = database;
        this.accountRepoLocal = accountRepoLocal;
        this.populateCache();
    }

    async getByUid(uid: string): Promise<ProvisionedMuTag> {
        await this.onCachePopulated();

        if (this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new MuTagDoesNotExist(uid);
        }
    }

    async getByBeaconId(beaconId: BeaconId): Promise<ProvisionedMuTag> {
        await this.onCachePopulated();
        const uid = this.muTagBeaconIdToUIDCache.get(beaconId.toString());
        if (uid != null && this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new MuTagDoesNotExist(beaconId.toString());
        }
    }

    async getAll(): Promise<Set<ProvisionedMuTag>> {
        await this.onCachePopulated();

        return new Set(this.muTagCache.values());
    }

    async add(muTag: ProvisionedMuTag): Promise<void> {
        const rawMuTag = muTag.serialize();

        try {
            await this.database.set(`muTags/${muTag.uid}`, rawMuTag);
            this.muTagCache.set(muTag.uid, muTag);
            this.muTagBeaconIdToUIDCache.set(
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
            const beaconIds = [...this.muTagBeaconIdToUIDCache]
                .filter(({ 1: value }): boolean => value === uid)
                .map(([key]): string => key);
            beaconIds.forEach((key): void => {
                this.muTagBeaconIdToUIDCache.delete(key);
            });
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }

    private async onCachePopulated(): Promise<void> {
        switch (this.cacheStatus) {
            case CacheStatus.Populated:
                return;
            case CacheStatus.Unpopulated:
            case CacheStatus.PopulationFailed:
                this.populateCache();
        }

        return new Promise((resolve, reject): void => {
            this.executeOnCachePopulated.push({
                resolve: resolve,
                reject: reject
            });
        });
    }

    private populateCache(): void {
        switch (this.cacheStatus) {
            case CacheStatus.Populated:
            case CacheStatus.Populating:
                return;
        }
        this.cacheStatus = CacheStatus.Populating;
        this.getAllMuTagsFromDatabase()
            .then((muTags): void => {
                muTags.forEach((muTag): void => {
                    this.muTagCache.set(muTag.uid, muTag);
                    this.muTagBeaconIdToUIDCache.set(
                        muTag.beaconId.toString(),
                        muTag.uid
                    );
                });
                this.cacheStatus = CacheStatus.Populated;
                this.executeOnCachePopulated.forEach((executor): void => {
                    executor.resolve();
                });
            })
            .catch((e): void => {
                if (e.name === "AccountDoesNotExist") {
                    this.cacheStatus = CacheStatus.Populated;
                    this.executeOnCachePopulated.forEach((executor): void => {
                        executor.resolve();
                    });
                    return;
                }

                this.cacheStatus = CacheStatus.PopulationFailed;
                this.executeOnCachePopulated.forEach((executor): void => {
                    executor.reject(e);
                });
            })
            .finally((): void => {
                this.executeOnCachePopulated.length = 0;
            });
    }

    private async getAllMuTagsFromDatabase(): Promise<Set<ProvisionedMuTag>> {
        const account = await this.accountRepoLocal.get();
        const muTags = new Set<ProvisionedMuTag>();

        for (const muTagUid of account.muTags) {
            const rawMuTag = await this.database.get(`muTags/${muTagUid}`);
            if (rawMuTag == null) {
                throw new MuTagDoesNotExist(muTagUid);
            }
            muTags.add(ProvisionedMuTag.deserialize(rawMuTag));
        }

        return new Set(muTags);
    }
}
