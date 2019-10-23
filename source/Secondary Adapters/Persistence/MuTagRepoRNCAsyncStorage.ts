import {
    MuTagRepositoryLocal,
    FailedToAdd,
    FailedToGet,
    DoesNotExist,
    FailedToRemove,
    FailedToUpdate,
} from '../../Core/Ports/MuTagRepositoryLocal';
import ProvisionedMuTag from '../../Core/Domain/ProvisionedMuTag';
import AsyncStorage from '@react-native-community/async-storage';

export class MuTagRepoRNCAsyncStorage implements MuTagRepositoryLocal {

    async getByUID(uid: string): Promise<ProvisionedMuTag> {
        let rawMuTag: string | null;

        try {
            rawMuTag = await AsyncStorage.getItem(`muTags/${uid}`);
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }

        if (typeof rawMuTag !== 'string') {
            throw new DoesNotExist();
        }

        return ProvisionedMuTag.deserialize(rawMuTag);
    }

    async getAll(): Promise<Set<ProvisionedMuTag>> {
        try {
            const regExp = /^muTags\//;
            const keys = await AsyncStorage.getAllKeys();
            const muTagKeys = keys.filter((key): boolean => regExp.test(key));
            const rawMuTagKeyPairs = await AsyncStorage.multiGet(muTagKeys);
            const rawMuTags = rawMuTagKeyPairs
                .map((rawMuTagKeyPair): string => rawMuTagKeyPair[1] || '')
                .filter((rawMuTag): boolean => rawMuTag !== '');
            const muTags = rawMuTags.map((rawMuTag): ProvisionedMuTag => ProvisionedMuTag.deserialize(rawMuTag));

            return new Set(muTags);
        } catch (e) {
            console.log(e);
            throw new FailedToGet();
        }
    }

    async add(muTag: ProvisionedMuTag): Promise<void> {
        const rawMuTag = muTag.serialize();

        try {
            await AsyncStorage.setItem(`muTags/${muTag.getUID()}`, rawMuTag);
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
            // Using 'setItem' because documentation of 'mergeItem' is too vague.
            // I don't want to have any unforeseen issues.
            await AsyncStorage.setItem(`muTags/${muTag.getUID()}`, rawMuTag);
        } catch (e) {
            console.log(e);
            throw new FailedToUpdate();
        }
    }

    async removeByUID(uid: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(`muTags/${uid}`);
        } catch (e) {
            console.log(e);
            throw new FailedToRemove();
        }
    }
}
