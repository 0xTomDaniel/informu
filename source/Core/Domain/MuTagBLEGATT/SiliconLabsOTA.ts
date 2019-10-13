import { WritableCharacteristic, NumberCharacteristic } from './Characteristic';
import Service from './Service';

abstract class SiliconLabsOTANumberCharacteristic extends NumberCharacteristic {
    readonly serviceUUID = '1D14D6EE-FD63-4FA1-BFA4-8F47B42119F0';
}

class OTAControl extends SiliconLabsOTANumberCharacteristic
    implements WritableCharacteristic<number>
{
    readonly uuid = 'F7BF3564-FB6D-4E53-88A4-5E37E0326063';
    readonly byteLength = 1;
    readonly withResponse = true;
}

export default class SiliconLabsOTA extends Service {
    static readonly uuid = '1D14D6EE-FD63-4FA1-BFA4-8F47B42119F0';

    static readonly OTAControl = new OTAControl();
}
