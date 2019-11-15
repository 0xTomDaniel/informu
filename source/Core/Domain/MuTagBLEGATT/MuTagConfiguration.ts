import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic,
    HexCharacteristic,
    UTF8Characteristic,
} from './Characteristic';
import Service from './Service';
import Hexadecimal from '../Hexadecimal';

abstract class MuTagConfigurationCharacteristic<T> extends Characteristic<T> {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

abstract class MuTagConfigurationHexCharacteristic extends HexCharacteristic {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

abstract class MuTagConfigurationUTF8Characteristic extends UTF8Characteristic {
    readonly serviceUUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';
}

class DeviceUUID extends MuTagConfigurationUTF8Characteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB01';
    readonly byteLength = 16;
}

class Major extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements ReadableCharacteristic<Hexadecimal | undefined>, WritableCharacteristic<Hexadecimal | undefined>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB02';
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64Value?: string): Hexadecimal | undefined {
        if (base64Value == null) {
            return undefined;
        }

        return Characteristic.base64ToHex(base64Value);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }
}

class Minor extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements ReadableCharacteristic<Hexadecimal | undefined>, WritableCharacteristic<Hexadecimal | undefined>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB03';
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64Value?: string): Hexadecimal | undefined {
        if (base64Value == null) {
            return undefined;
        }

        return Characteristic.base64ToHex(base64Value);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }
}

class TXPower extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB04';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Authenticate extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB05';
    readonly byteLength = 1;
    readonly withResponse = false;

    readonly authCode = Hexadecimal.fromString('55');
}

class TagColor extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB06';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class DeepSleep extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB07';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Provision extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements ReadableCharacteristic<Hexadecimal | undefined>, WritableCharacteristic<Hexadecimal | undefined>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB08';
    readonly byteLength = 1;
    readonly withResponse = true;

    readonly provisionCode = Hexadecimal.fromString('27');
    readonly unprovisionCode = Hexadecimal.fromString('45');

    fromBase64(base64Value?: string): Hexadecimal | undefined {
        if (base64Value == null) {
            return undefined;
        }

        return Characteristic.base64ToHex(base64Value);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }
}

class AdvertisingInterval extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB09';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class RawBattery extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB10';
    readonly byteLength = 4;
}

class DebugMode extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB11';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LEDColor extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
{
    readonly uuid = 'AC9B44EA-AA5E-40F4-888A-C2637573AB12';
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LEDControl extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal>, WritableCharacteristic<Hexadecimal>
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
    static readonly Provision = new Provision();
    static readonly AdvertisingInterval = new AdvertisingInterval();
    static readonly RawBattery = new RawBattery();
    static readonly DebugMode = new DebugMode();
    static readonly LEDColor = new LEDColor();
    static readonly LEDControl = new LEDControl();
}
