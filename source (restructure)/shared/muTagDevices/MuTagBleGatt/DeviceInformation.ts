import {
    ReadableCharacteristic,
    HexCharacteristic,
    UTF8Characteristic
} from "../../bluetooth/Characteristic";
import Hexadecimal from "../../metaLanguage/Hexadecimal";
import Service from "../../bluetooth/Service";

abstract class DeviceInformationHexCharacteristic extends HexCharacteristic {
    readonly serviceUuid = "0000180A-0000-1000-8000-00805F9B34FB";
}

abstract class DeviceInformationUTF8Characteristic extends UTF8Characteristic {
    readonly serviceUuid = "0000180A-0000-1000-8000-00805F9B34FB";
}

class ManufacturerName extends DeviceInformationUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A29-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 11;
}

class FirmwareRevisionString extends DeviceInformationUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A26-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 3;
}

class ModelNumberString extends DeviceInformationUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A24-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 8;
}

class SystemID extends DeviceInformationUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A23-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 6;
}

class BatteryLevel extends DeviceInformationHexCharacteristic
    implements ReadableCharacteristic<Hexadecimal> {
    readonly uuid = "00002A19-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 1;
}

export default class DeviceInformation extends Service {
    static readonly uuid = "0000180A-0000-1000-8000-00805F9B34FB";

    static readonly ManufacturerName = new ManufacturerName();
    static readonly FirmwareRevisionString = FirmwareRevisionString;
    static readonly ModelNumberString = ModelNumberString;
    static readonly SystemID = SystemID;
    static readonly BatteryLevel = new BatteryLevel();
}
