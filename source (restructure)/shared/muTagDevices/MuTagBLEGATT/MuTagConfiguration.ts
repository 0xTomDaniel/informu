import Characteristic, {
    ReadableCharacteristic,
    WritableCharacteristic,
    HexCharacteristic,
    UTF8Characteristic
} from "../../bluetooth/Characteristic";
import Service from "./Service";
import Hexadecimal from "../../metaLanguage/Hexadecimal";
import { Buffer } from "buffer";

abstract class MuTagConfigurationCharacteristic<T> extends Characteristic<T> {
    readonly serviceUuid = "A173424A-9708-4C4C-AEED-0AB1AF539797";
}

abstract class MuTagConfigurationHexCharacteristic extends HexCharacteristic {
    readonly serviceUuid = "A173424A-9708-4C4C-AEED-0AB1AF539797";
}

abstract class MuTagConfigurationUTF8Characteristic extends UTF8Characteristic {
    readonly serviceUuid = "A173424A-9708-4C4C-AEED-0AB1AF539797";
}

class DeviceUuid extends MuTagConfigurationUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB01";
    readonly byteLength = 16;
}

class Major extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements
        ReadableCharacteristic<Hexadecimal | undefined>,
        WritableCharacteristic<Hexadecimal | undefined> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB02";
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64?: string): Hexadecimal | undefined {
        return base64 == null ? undefined : Characteristic.base64ToHex(base64);
    }

    fromData(data?: Buffer): Hexadecimal | undefined {
        return data == null ? undefined : Characteristic.dataToHex(data);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }

    toData(hex: Hexadecimal): Buffer {
        return Characteristic.hexToData(hex);
    }
}

class Minor extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements
        ReadableCharacteristic<Hexadecimal | undefined>,
        WritableCharacteristic<Hexadecimal | undefined> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB03";
    readonly byteLength = 2;
    readonly withResponse = true;

    fromBase64(base64?: string): Hexadecimal | undefined {
        return base64 == null ? undefined : Characteristic.base64ToHex(base64);
    }

    fromData(data?: Buffer): Hexadecimal | undefined {
        return data == null ? undefined : Characteristic.dataToHex(data);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }

    toData(hex: Hexadecimal): Buffer {
        return Characteristic.hexToData(hex);
    }
}

class TxPower extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB04";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Authenticate extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB05";
    readonly byteLength = 1;
    readonly withResponse = false;

    readonly authCode = Hexadecimal.fromString("55");
}

class TagColor extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB06";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class DeepSleep extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB07";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class Provision
    extends MuTagConfigurationCharacteristic<Hexadecimal | undefined>
    implements
        ReadableCharacteristic<Hexadecimal | undefined>,
        WritableCharacteristic<Hexadecimal | undefined> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB08";
    readonly byteLength = 1;
    readonly withResponse = true;

    readonly provisionCode = Hexadecimal.fromString("27");
    readonly unprovisionCode = Hexadecimal.fromString("45");

    fromBase64(base64?: string): Hexadecimal | undefined {
        return base64 == null ? undefined : Characteristic.base64ToHex(base64);
    }

    fromData(data?: Buffer): Hexadecimal | undefined {
        return data == null ? undefined : Characteristic.dataToHex(data);
    }

    toBase64(value: Hexadecimal): string {
        return Characteristic.hexToBase64(value);
    }

    toData(hex: Hexadecimal): Buffer {
        return Characteristic.hexToData(hex);
    }
}

class AdvertisingInterval extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB09";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class RawBattery extends MuTagConfigurationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB10";
    readonly byteLength = 4;
}

class DebugMode extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB11";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LedColor extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB12";
    readonly byteLength = 1;
    readonly withResponse = true;
}

class LedControl extends MuTagConfigurationHexCharacteristic
    implements
        ReadableCharacteristic<Hexadecimal>,
        WritableCharacteristic<Hexadecimal> {
    readonly uuid = "AC9B44EA-AA5E-40F4-888A-C2637573AB13";
    readonly byteLength = 1;
    readonly withResponse = true;
}

export default class MuTagConfiguration extends Service {
    static readonly uuid = "A173424A-9708-4C4C-AEED-0AB1AF539797";

    static readonly DeviceUuid = new DeviceUuid();
    static readonly Major = new Major();
    static readonly Minor = new Minor();
    static readonly TxPower = new TxPower();
    static readonly Authenticate = new Authenticate();
    static readonly TagColor = new TagColor();
    static readonly DeepSleep = new DeepSleep();
    static readonly Provision = new Provision();
    static readonly AdvertisingInterval = new AdvertisingInterval();
    static readonly RawBattery = new RawBattery();
    static readonly DebugMode = new DebugMode();
    static readonly LedColor = new LedColor();
    static readonly LedControl = new LedControl();
}
