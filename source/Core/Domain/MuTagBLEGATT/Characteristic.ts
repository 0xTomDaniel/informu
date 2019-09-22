import { Buffer } from 'buffer';

export interface ReadableCharacteristic<T> {
    fromBase64(base64Value?: string): T;
}

export interface WritableCharacteristic<T> {
    readonly withResponse: boolean;

    toBase64(value: T): string;
}

export default abstract class Characteristic<T> {
    abstract readonly uuid: string;
    abstract readonly serviceUUID: string;
    abstract readonly byteLength: number;

    protected static numberToBase64(value: number): string {
        const hex = value.toString(16);
        const bytes = Buffer.from(hex, 'hex');
        return bytes.toString('base64');
    }

    protected static base64ToNumber(base64: string): number {
        const bytes = Buffer.from(base64, 'base64');
        return bytes.readIntBE(0, bytes.byteLength);
    }

    protected static stringToBase64(value: string): string {
        const bytes = Buffer.from(value);
        return bytes.toString('base64');
    }

    protected static base64ToString(base64: string): string {
        const bytes = Buffer.from(base64, 'base64');
        return bytes.toString();
    }
}
