import { LocalDatabase } from './LocalDatabase';
import AsyncStorage from '@react-native-community/async-storage';

export class RNCAsyncStorage implements LocalDatabase {

    async create(key: string, value: string): Promise<void> {
        await AsyncStorage.setItem(key, value);
    }

    async read(key: string): Promise<string> {
        const value = await AsyncStorage.getItem(key);
        if (value == null) {
            throw Error('Key does not exist.');
        } else {
            return value;
        }
    }

    async update(key: string, value: string): Promise<void> {
        await AsyncStorage.mergeItem(key, value);
    }

    async delete(key: string): Promise<void> {
        await AsyncStorage.removeItem(key);
    }
}
