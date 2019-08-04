export interface LocalDatabase {
    create(key: string, value: string): Promise<void>;
    read(key: string): Promise<string>;
    update(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
