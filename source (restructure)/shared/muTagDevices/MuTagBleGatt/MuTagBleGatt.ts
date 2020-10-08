import GenericAccess from "./GenericAccess";
import DeviceInformation from "./DeviceInformation";
import MuTagConfiguration from "./MuTagConfiguration";
import SiliconLabsOta from "./SiliconLabsOta";

export abstract class MuTagBleGatt {
    static readonly GenericAccess = GenericAccess;
    static readonly DeviceInformation = DeviceInformation;
    static readonly MuTagConfiguration = MuTagConfiguration;
    static readonly SiliconLabsOta = SiliconLabsOta;
}
