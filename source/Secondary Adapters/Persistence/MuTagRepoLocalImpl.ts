import {
    MuTagRepositoryLocal,
    FailedToAdd,
    DoesNotExist,
    FailedToRemove,
    FailedToUpdate,
} from '../../Core/Ports/MuTagRepositoryLocal';
import ProvisionedMuTag, { BeaconID } from '../../Core/Domain/ProvisionedMuTag';
import { AccountRepositoryLocal } from '../../Core/Ports/AccountRepositoryLocal';
import { Database } from './Database';

interface PromiseExecutor {
    resolve: (value?: void | PromiseLike<void> | undefined) => void;
    reject: (reason?: any) => void;
}

export default class MuTagRepoLocalImpl implements MuTagRepositoryLocal {

    private readonly database: Database;
    private readonly accountRepoLocal: AccountRepositoryLocal
    private readonly muTagCache = new Map<string, ProvisionedMuTag>();
    private readonly muTagBeaconIDToUIDCache = new Map<string, string>();
    private cachePopulated = false;
    private readonly executeOnCachePopulated: PromiseExecutor[] = [];

    constructor(database: Database, accountRepoLocal: AccountRepositoryLocal) {
        this.database = database;
        this.accountRepoLocal = accountRepoLocal;
        this.populateCache();
    }

    async getByUID(uid: string): Promise<ProvisionedMuTag> {
        await this.onCachePopulated();

        if (this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new DoesNotExist(uid);
        }
    }

    async getByBeaconID(beaconID: BeaconID): Promise<ProvisionedMuTag> {
        await this.onCachePopulated();

        const uid = this.muTagBeaconIDToUIDCache.get(beaconID.toString());
        if (uid != null && this.muTagCache.has(uid)) {
            return this.muTagCache.get(uid) as ProvisionedMuTag;
        } else {
            throw new DoesNotExist(beaconID.toString());
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
            this.muTagBeaconIDToUIDCache.set(muTag.beaconID.toString(), muTag.uid);
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

    async removeByUID(uid: string): Promise<void> {
        try {
            await this.database.remove(`muTags/${uid}`);
            this.muTagCache.delete(uid);
            const beaconIDs = [...this.muTagBeaconIDToUIDCache]
                .filter(({ 1: value }): boolean => value === uid)
                .map(([key]): string => key);
            beaconIDs.forEach((key): void => { this.muTagBeaconIDToUIDCache.delete(key); });
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }

    private async onCachePopulated(): Promise<void> {
        if (this.cachePopulated) {
            return;
        }

        return new Promise((resolve, reject): void => {
            this.executeOnCachePopulated.push({ resolve: resolve, reject: reject });
        });
    }

    private populateCache(): void {
        this.getAllMuTagsFromDatabase().then((muTags): void => {
            muTags.forEach((muTag): void => {
                this.muTagCache.set(muTag.uid, muTag);
                this.muTagBeaconIDToUIDCache.set(muTag.beaconID.toString(), muTag.uid);
            });
            this.cachePopulated = true;
            this.executeOnCachePopulated.forEach((executor): void => {
                executor.resolve();
            });
        }).catch((e): void => {
            this.executeOnCachePopulated.forEach((executor): void => {
                executor.reject(e);
            });
        }).finally((): void => {
            this.executeOnCachePopulated.length = 0;
        });
    }

    private async getAllMuTagsFromDatabase(): Promise<Set<ProvisionedMuTag>> {
        const account = await this.accountRepoLocal.get();
        const muTags = new Set<ProvisionedMuTag>();

        for (let muTagUID of account.muTags) {
            const rawMuTag = await this.database.get(`muTags/${muTagUID}`);
            if (rawMuTag == null) {
                throw new DoesNotExist(muTagUID);
            }
            muTags.add(ProvisionedMuTag.deserialize(rawMuTag));
        }

        return new Set(muTags);
    }
}
