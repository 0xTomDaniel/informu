import Characteristic, { ReadableCharacteristic, WritableCharacteristic } from './Characteristic';
import Service from './Service';

abstract class MuTagConfigurationCharacteristic<T> extends Characteristic<T> {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

class DeviceUUID extends MuTagConfigurationCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB01';
    readonly byteLength = 16;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class Major extends MuTagConfigurationCharacteristic<number | undefined>
    implements ReadableCharacteristic<number | undefined>, WritableCharacteristic<number | undefined>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB02';
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64Value?: string): number | undefined {
        if (base64Value == null) {
            return undefined;
        }

        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class Minor extends MuTagConfigurationCharacteristic<number | undefined>
    implements ReadableCharacteristic<number | undefined>, WritableCharacteristic<number | undefined>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB03';
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64Value?: string): number | undefined {
        if (base64Value == null) {
            return undefined;
        }

        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class TXPower extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB04';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class Authenticate extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB05';
    readonly byteLength = 1;
    readonly withResponse = false;

    readonly authKey = 0x55;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class TagColor extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB06';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class DeepSleep extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB07';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class Provisioned extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB08';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class AdvertisingInterval extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB09';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class RawBattery extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB10';
    readonly byteLength = 4;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }
}

class DebugMode extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB11';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class LEDColor extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB12';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

class LEDControl extends MuTagConfigurationCharacteristic<number>
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB13';
    readonly byteLength = 1;
    readonly withResponse = true;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }

    toBase64(value: number): string {
        return Characteristic.numberToBase64(value);
    }
}

export default class MuTagConfiguration extends Service {
    static readonly uuid = 'A173424A-9708-4C4C-AEED-0AB1AF539797';

    static readonly DeviceUUID = new DeviceUUID();
    static readonly Major = new Major();
    static readonly Minor = new Minor();
    static readonly TXPower = new TXPower();
    static readonly Authenticate = new Authenticate();
    static readonly TagColor = new TagColor();
    static readonly DeepSleep = new DeepSleep();
    static readonly Provisioned = new Provisioned();
    static readonly AdvertisingInterval = new AdvertisingInterval();
    static readonly RawBattery = new RawBattery();
    static readonly DebugMode = new DebugMode();
    static readonly LEDColor = new LEDColor();
    static readonly LEDControl = new LEDControl();
}
