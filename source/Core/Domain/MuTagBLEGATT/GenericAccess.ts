import { ReadableCharacteristic, StringCharacteristic } from './Characteristic';
import Service from './Service';

abstract class GenericAccessStringCharacteristic extends StringCharacteristic {
    readonly serviceUUID = '00001800-0000-1000-8000-00805F9B34FB';
}

class DeviceName extends GenericAccessStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A00-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 14;
}

class Appearance extends GenericAccessStringCharacteristic
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A01-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 20;
}

export default class GenericAccess extends Service {
    static readonly uuid = '00001800-0000-1000-8000-00805F9B34FB';

    static readonly DeviceName = new DeviceName();
    static readonly Appearance = new Appearance();
}
