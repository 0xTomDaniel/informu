import { Service, Characteristic, CharacteristicWriteOption } from './MuTagBLEGATT';

class ManufacturerName extends Characteristic {
    static readonly UUID = '00002A29-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 11;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class FirmwareRevisionString extends Characteristic {
    static readonly UUID = '00002A26-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 3;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class ModelNumberString extends Characteristic {
    static readonly UUID = '00002A24-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 8;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class SystemID extends Characteristic {
    static readonly UUID = '00002A23-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 6;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class BatteryLevel extends Characteristic {
    static readonly UUID = '00002A19-0000-1000-8000-00805F9B34FB';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

export default class DeviceInformation extends Service {
    static readonly UUID = '0000180A-0000-1000-8000-00805F9B34FB';

    static readonly ManufacturerName = ManufacturerName;
    static readonly FirmwareRevisionString = FirmwareRevisionString;
    static readonly ModelNumberString = ModelNumberString;
    static readonly SystemID = SystemID;
    static readonly BatteryLevel = BatteryLevel;
}
