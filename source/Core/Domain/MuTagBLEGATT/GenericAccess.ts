import Characteristic, { ReadableCharacteristic } from './Characteristic';
import Service from './Service';

abstract class GenericAccessCharacteristic<T> extends Characteristic<T> {
    readonly serviceUUID = '00001800-0000-1000-8000-00805F9B34FB';
}

class DeviceName extends GenericAccessCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A00-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 14;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

class Appearance extends GenericAccessCharacteristic<string>
    implements ReadableCharacteristic<string>
{
    readonly uuid = '00002A01-0000-1000-8000-00805F9B34FB';
    readonly byteLength = 20;

    fromBase64(base64Value: string): string {
        return Characteristic.base64ToString(base64Value);
    }
}

export default class GenericAccess extends Service {
    static readonly uuid = '00001800-0000-1000-8000-00805F9B34FB';

    static readonly DeviceName = new DeviceName();
    static readonly Appearance = new Appearance();
}
