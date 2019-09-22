import GenericAccess from './GenericAccess';
import DeviceInformation from './DeviceInformation';
import MuTagConfiguration from './MuTagConfiguration';
import SiliconLabsOTA from './SiliconLabsOTA';

export class MuTagBLEGATT {
    static readonly GenericAccess = GenericAccess;
    static readonly DeviceInformation = DeviceInformation;
    static readonly MuTagConfiguration = MuTagConfiguration;
    static readonly SiliconLabsOTA = SiliconLabsOTA;

    // Prevents instantiation because this class is just being used to hold static values
    private constructor() {}
}
