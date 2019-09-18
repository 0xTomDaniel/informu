import { Service, Characteristic, CharacteristicWriteOption } from './MuTagBLEGATT';

class OTAControl extends Characteristic {
    static readonly UUID = 'F7BF3564-FB6D-4E53-88A4-5E37E0326063';
    static readonly byteLength = 1;
    static readonly writeOption = CharacteristicWriteOption.WithResponse;
    static readonly readable = false;
}

export default class SiliconLabsOTA extends Service {
    static readonly UUID = '1D14D6EE-FD63-4FA1-BFA4-8F47B42119F0';

    static readonly OTAControl = OTAControl;
}
