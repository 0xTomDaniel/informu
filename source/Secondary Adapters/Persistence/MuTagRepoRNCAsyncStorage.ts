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

    async add(muTag: ProvisionedMuTag): Promise<void> {
        const rawMuTag = muTag.serialize();

        try {
            await AsyncStorage.setItem(`muTags/${muTag.getUID()}`, rawMuTag);
        } catch (e) {
            console.log(e);
            throw new FailedToAdd();
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
