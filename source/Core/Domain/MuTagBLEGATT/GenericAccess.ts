import { Service, Characteristic, CharacteristicWriteOption } from './MuTagBLEGATT';

class DeviceName extends Characteristic {
    static readonly UUID = '00002A00-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 14;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class Appearance extends Characteristic {
    static readonly UUID = '00002A01-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 20;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

export default class GenericAccess extends Service {
    static readonly UUID = '00001800-0000-1000-8000-00805F9B34FB';

    static readonly DeviceName = DeviceName;
    static readonly Appearance = Appearance;
}
