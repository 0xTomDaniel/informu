class InvalidHexadecimalString extends Error {

    constructor(value: string) {
        super(`${value} is an invalid hexadecimal string.`);
        this.name = 'InvalidHexadecimalString';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class Hexadecimal {

    private static regExpHex = /^(0x)?[0-9a-fA-F]+$/;
    protected readonly numberValue: number;
    protected readonly stringValue: string;

    protected constructor(hex: string, numberValue: number) {
        this.stringValue = hex;
        this.numberValue = numberValue;
    }

    valueOf(): number {
        return this.numberValue;
    }

    toString(): string {
        return this.stringValue;
    }

    static fromString(hex: string): Hexadecimal {
        const numberValue = Hexadecimal.numberFromString(hex);
        return new Hexadecimal(hex, numberValue);
    }

    static fromNumber(value: number, prefix: boolean = false, minLength?: number): Hexadecimal {
        let hex = value.toString(16).toUpperCase();

        // Might be able to refactor using padStart(X, '0')
        if (minLength != null) {
            const paddingLength = Math.max(0, minLength - hex.length);
            hex = '0'.repeat(paddingLength) + hex;
        }

        if (prefix) {
            hex = '0x' + hex;
        }

        return new Hexadecimal(hex, value);
    }

    protected static numberFromString(hex: string): number {
        if (!this.regExpHex.test(hex)) {
            throw new InvalidHexadecimalString(hex);
        }

        return parseInt(hex, 16);
    }
}
