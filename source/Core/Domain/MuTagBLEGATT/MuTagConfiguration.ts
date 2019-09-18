import { Service, Characteristic, CharacteristicWriteOption } from './MuTagBLEGATT';

class DeviceUUID extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB01';
    static readonly byteLength = 16;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class DeviceMajor extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB02';
    static readonly byteLength = 2;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class DeviceMinor extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB03';
    static readonly byteLength = 2;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class TXPower extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB04';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class Authenticate extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB05';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithoutResponse;
    static readonly readable = false;
}

class TagColor extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB06';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class DeepSleep extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB07';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = false;
}

class Provisioned extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB08';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class AdvertisingInterval extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB09';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class RawBattery extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB10';
    static readonly byteLength = 4;
    static readonly writeOption = CharacteristicWriteOption.Disabled;
    static readonly readable = true;
}

class DebugMode extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB11';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class LEDColor extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB12';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

class LEDControl extends Characteristic {
    static readonly UUID = 'AC9B44EA-AA5E-40F4-888A-C2637573AB13';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = true;
}

export default class MuTagConfiguration extends Service {
    static readonly UUID = 'A173424A-9708-4C4C-AEED-0AB1AF539797';

    static readonly DeviceUUID = DeviceUUID;
    static readonly DeviceMajor = DeviceMajor;
    static readonly DeviceMinor = DeviceMinor;
    static readonly TXPower = TXPower;
    static readonly Authenticate = Authenticate;
    static readonly TagColor = TagColor;
    static readonly DeepSleep = DeepSleep;
    static readonly Provisioned = Provisioned;
    static readonly AdvertisingInterval = AdvertisingInterval;
    static readonly RawBattery = RawBattery;
    static readonly DebugMode = DebugMode;
    static readonly LEDColor = LEDColor;
    static readonly LEDControl = LEDControl;
}
