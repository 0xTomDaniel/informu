import GenericAccess from './GenericAccess';
import DeviceInformation from './DeviceInformation';
import MuTagConfiguration from './MuTagConfiguration';
import SiliconLabsOTA from './SiliconLabsOTA';

export enum CharacteristicWriteOption {
    WithResponse,
    WithoutResponse,
    Disabled,
}

export class Characteristic {
    static readonly UUID: string;
    static readonly byteLength: number;
    static readonly writeOption: CharacteristicWriteOption;
    static readonly readable: boolean;

    // Prevents instantiation because this class is just being used to hold static values
    protected constructor() {}
}

export class Service {
    static readonly UUID: string;

    // Prevents instantiation because this class is just being used to hold static values
    protected constructor() {}
}

export class MuTagBLEGATT {
    static readonly GenericAccess = GenericAccess;
    static readonly DeviceInformation = DeviceInformation;
    static readonly MuTagConfiguration = MuTagConfiguration;
    static readonly SiliconLabsOTA = SiliconLabsOTA;

    // Prevents instantiation because this class is just being used to hold static values
    private constructor() {}
}
