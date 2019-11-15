import { Buffer } from 'buffer';
import Hexadecimal from '../Hexadecimal';

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

    protected static hexToBase64(hex: Hexadecimal): string {
        const bytes = Buffer.from(hex.toString(), 'hex');
        return bytes.toString('base64');
    }

    protected static base64ToHex(base64: string): Hexadecimal {
        const bytes = Buffer.from(base64, 'base64');
        return Hexadecimal.fromString(bytes.toString('hex'));
    }

    protected static utf8ToBase64(utf8: string): string {
        const bytes = Buffer.from(utf8);
        return bytes.toString('base64');
    }

    protected static base64ToUTF8(base64: string): string {
        const bytes = Buffer.from(base64, 'base64');
        return bytes.toString();
    }
}

export abstract class HexCharacteristic extends Characteristic<Hexadecimal> {
    fromBase64(base64Value: string): Hexadecimal {
        return Characteristic.base64ToHex(base64Value);
    }

    toBase64(hex: Hexadecimal): string {
        return Characteristic.hexToBase64(hex);
    }
}

export abstract class UTF8Characteristic extends Characteristic<string> {
    fromBase64(base64Value: string): string {
        return Characteristic.base64ToUTF8(base64Value);
    }

    toBase64(value: string): string {
        return Characteristic.utf8ToBase64(value);
    }
}
