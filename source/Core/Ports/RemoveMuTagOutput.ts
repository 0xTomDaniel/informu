import { MuTagNotFound, UnprovisionMuTagFailed } from './MuTagDevices';
import { LowMuTagBattery } from '../Application/RemoveMuTagService';

export interface RemoveMuTagOutput {

    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showMuTagNotFoundError(error: MuTagNotFound): void;
    showUnprovisionMuTagFailedError(error: UnprovisionMuTagFailed): void;
    showLowBatteryError(error: LowMuTagBattery): void;
    showUnknownError(error: Error): void;
}
