import { RepositoryLocal, FailedToErase } from '../../Core/Ports/RepositoryLocal';
import AsyncStorage from '@react-native-community/async-storage';

export default class RepoLocalRNCAsyncStorage implements RepositoryLocal {

    async erase(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys);
        } catch (e) {
            console.log(e);
            throw new FailedToErase();
        }
    }
}
