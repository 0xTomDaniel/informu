import { LowMuTagBattery, AddMuTagTimedOut } from '../Application/AddMuTagService';

export interface AddMuTagOutput {

    showAddMuTagScreen(): void;
    showMuTagSetupScreen(): void;
    showHomeScreen(): void;
    showAddMuTagTimeoutError(error: AddMuTagTimedOut): void;
    showLowBatteryError(error: LowMuTagBattery): void;
}
