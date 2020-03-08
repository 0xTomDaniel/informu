import { ReadableCharacteristic, UTF8Characteristic } from "./Characteristic";
import Service from "./Service";

abstract class GenericAccessUTF8Characteristic extends UTF8Characteristic {
    readonly serviceUuid = "00001800-0000-1000-8000-00805F9B34FB";
}

class DeviceName extends GenericAccessUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A00-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 14;
}

class Appearance extends GenericAccessUTF8Characteristic
    implements ReadableCharacteristic<string> {
    readonly uuid = "00002A01-0000-1000-8000-00805F9B34FB";
    readonly byteLength = 20;
}

export default class GenericAccess extends Service {
    static readonly uuid = "00001800-0000-1000-8000-00805F9B34FB";

    static readonly DeviceName = new DeviceName();
    static readonly Appearance = new Appearance();
}
