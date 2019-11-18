import { MuTagNotFound, UnprovisionMuTagFailed } from './MuTagDevices';
import { LowMuTagBattery } from '../Application/RemoveMuTagService';

export interface RemoveMuTagOutput {

    showMuTagNotFoundError(error: MuTagNotFound): void;
    showUnprovisionMuTagFailedError(error: UnprovisionMuTagFailed): void;
    showLowBatteryError(error: LowMuTagBattery): void;
}
