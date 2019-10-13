import {
    ReadableCharacteristic,
    NumberCharacteristic,
    StringCharacteristic,
} from './Characteristic';
import Service from './Service';

abstract class DeviceInformationNumberCharacteristic extends NumberCharacteristic {
    readonly serviceUUID = '0000180A-0000-1000-8000-00805F9B34FB';
}

abstract class DeviceInformationStringCharacteristic extends StringCharacteristic {
    readonly serviceUUID = '0000180A-0000-1000-8000-00805F9B34FB';
}

class ManufacturerName extends DeviceInformationStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A29-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 11;
}

class FirmwareRevisionString extends DeviceInformationStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A26-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 3;
}

class ModelNumberString extends DeviceInformationStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A24-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 8;
}

class SystemID extends DeviceInformationStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A23-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 6;
}

class BatteryLevel extends DeviceInformationNumberCharacteristic
    implements ReadableCharacteristic<number>
{
    readonly uuid = '00002A19-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 1;
}

export default class DeviceInformation extends Service {
    static readonly uuid = '0000180A-0000-1000-8000-00805F9B34FB';

    static readonly ManufacturerName = new ManufacturerName();
    static readonly FirmwareRevisionString = FirmwareRevisionString;
    static readonly ModelNumberString = ModelNumberString;
    static readonly SystemID = SystemID;
    static readonly BatteryLevel = new BatteryLevel();
}
