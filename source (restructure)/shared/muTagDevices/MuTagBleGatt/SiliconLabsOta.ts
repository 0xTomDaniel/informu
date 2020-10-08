import {
    WritableCharacteristic,
    HexCharacteristic
} from "../../bluetooth/Characteristic";
import Service from "./Service";
import Hexadecimal from "../../metaLanguage/Hexadecimal";

abstract class SiliconLabsOtaHexCharacteristic extends HexCharacteristic {
    readonly serviceUuid = "1D14D6EE-FD63-4FA1-BFA4-8F47B42119F0";
}

class OtaControl extends SiliconLabsOtaHexCharacteristic
    implements WritableCharacteristic<Hexadecimal> {
    readonly uuid = "F7BF3564-FB6D-4E53-88A4-5E37E0326063";
    readonly byteLength = 1;
    readonly withResponse = true;
}

export default class SiliconLabsOta extends Service {
    static readonly uuid = "1D14D6EE-FD63-4FA1-BFA4-8F47B42119F0";

    static readonly OtaControl = new OtaControl();
}
