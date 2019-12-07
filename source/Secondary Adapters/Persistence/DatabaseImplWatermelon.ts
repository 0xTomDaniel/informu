import { Database } from './Database';
import { Database as WatermelonDB, appSchema } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

export default class DatabaseImplWatermelon implements Database {

    private readonly database: WatermelonDB;

    constructor(database?: WatermelonDB) {
        if (database != null) {
            this.database = database;
        } else {
            const schema = appSchema({
                version: 1,
                tables: [],
            });
            const adapter = new SQLiteAdapter({
                dbName: 'InformuApp',
                schema: schema,
            });
            this.database = new WatermelonDB({
                adapter,
                modelClasses: [],
                actionsEnabled: false,
            });
        }
    }

    async get(key: string): Promise<string | undefined> {
        const value = await this.database.adapter.getLocal(key);
        if (value == null) {
            return undefined;
        }
        return value;
    }

    async set(key: string, value: string): Promise<void> {
        await this.database.adapter.setLocal(key, value);
    }

    async remove(key: string): Promise<void> {
        await this.database.adapter.removeLocal(key);
    }

    async destroy(): Promise<void> {
        await this.database.action(async (): Promise<void> => {
            await this.database.unsafeResetDatabase;
        });
    }
}
