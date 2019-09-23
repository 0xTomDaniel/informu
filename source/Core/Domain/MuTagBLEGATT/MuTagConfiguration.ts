import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic,
    NumberCharacteristic,
    StringCharacteristic,
} from './Characteristic';
import Service from './Service';

abstract class MuTagConfigurationCharacteristic<T> extends Characteristic<T> {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

abstract class MuTagConfigurationNumberCharacteristic extends NumberCharacteristic {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

abstract class MuTagConfigurationStringCharacteristic extends StringCharacteristic {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

class DeviceUUID extends MuTagConfigurationStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB01';
    readonly byteLength = 16;
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

class TXPower extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB04';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Authenticate extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB05';
    readonly byteLength = 1;
    readonly withResponse = false;

    readonly authKey = 0x55;
}

class TagColor extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB06';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class DeepSleep extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB07';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Provisioned extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB08';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class AdvertisingInterval extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB09';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class RawBattery extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB10';
    readonly byteLength = 4;
}

class DebugMode extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB11';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LEDColor extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB12';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LEDControl extends MuTagConfigurationNumberCharacteristic
    implements ReadableCharacteristic<number>, WritableCharacteristic<number>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB13';
    readonly byteLength = 1;
    readonly withResponse = true;
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
