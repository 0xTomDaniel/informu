import { Buffer } from "buffer";
import Hexadecimal from "../../metaLanguage/Hexadecimal";

export interface ReadableCharacteristic<T> {
    fromBase64(base64?: string): T;
    fromData(data?: Buffer): T;
}

export interface WritableCharacteristic<T> {
    readonly withResponse: boolean;

    toBase64(value: T): string;
    toData(value: T): Buffer;
}

export default abstract class Characteristic<T> {
    abstract readonly uuid: string;
    abstract readonly serviceUuid: string;
    abstract readonly byteLength: number;

    protected static hexToBase64(hex: Hexadecimal): string {
        const bytes = Buffer.from(hex.toString(), "hex");
        return bytes.toString("base64");
    }

    protected static hexToData(hex: Hexadecimal): Buffer {
        const bytes = Buffer.from(hex.toString(), "hex");
        return bytes;
    }

    protected static base64ToHex(base64: string): Hexadecimal {
        const bytes = Buffer.from(base64, "base64");
        return Hexadecimal.fromString(bytes.toString("hex"));
    }

    protected static dataToHex(data: Buffer): Hexadecimal {
        return Hexadecimal.fromString(data.toString("hex"));
    }

    protected static utf8ToBase64(utf8: string): string {
        const bytes = Buffer.from(utf8);
        return bytes.toString("base64");
    }

    protected static utf8ToData(utf8: string): Buffer {
        const bytes = Buffer.from(utf8);
        return bytes;
    }

    protected static base64ToUtf8(base64: string): string {
        const bytes = Buffer.from(base64, "base64");
        return bytes.toString();
    }

    protected static dataToUtf8(data: Buffer): string {
        return data.toString();
    }
}

export abstract class HexCharacteristic extends Characteristic<Hexadecimal> {
    fromBase64(base64: string): Hexadecimal {
        return Characteristic.base64ToHex(base64);
    }

    fromData(data: Buffer): Hexadecimal {
        return Characteristic.dataToHex(data);
    }

    toBase64(hex: Hexadecimal): string {
        return Characteristic.hexToBase64(hex);
    }

    toData(hex: Hexadecimal): Buffer {
        return Characteristic.hexToData(hex);
    }
}

export abstract class UTF8Characteristic extends Characteristic<string> {
    fromBase64(base64: string): string {
        return Characteristic.base64ToUtf8(base64);
    }

    fromData(data: Buffer): string {
        return Characteristic.dataToUtf8(data);
    }

    toBase64(utf8: string): string {
        return Characteristic.utf8ToBase64(utf8);
    }

    toData(utf8: string): Buffer {
        return Characteristic.utf8ToData(utf8);
    }
}
