import Characteristic, { ReadableCharacteristic } from './Characteristic';
import Service from './Service';

abstract class DeviceInformationCharacteristic<T> extends Characteristic<T> {
    readonly serviceUUID = '0000180A-0000-1000-8000-00805F9B34FB';
}

class ManufacturerName extends DeviceInformationCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A29-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 11;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class FirmwareRevisionString extends DeviceInformationCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A26-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 3;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class ModelNumberString extends DeviceInformationCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A24-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 8;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class SystemID extends DeviceInformationCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A23-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 6;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class BatteryLevel extends DeviceInformationCharacteristic<number>
    implements ReadableCharacteristic<number>
{
    readonly uuid = '00002A19-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 1;

    fromBase64(base64Value: string): number {
        return Characteristic.base64ToNumber(base64Value);
    }
}

export default class DeviceInformation extends Service {
    static readonly uuid = '0000180A-0000-1000-8000-00805F9B34FB';

    static readonly ManufacturerName = new ManufacturerName();
    static readonly FirmwareRevisionString = FirmwareRevisionString;
    static readonly ModelNumberString = ModelNumberString;
    static readonly SystemID = SystemID;
    static readonly BatteryLevel = new BatteryLevel();
}
