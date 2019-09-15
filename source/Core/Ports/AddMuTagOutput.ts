import { LowMuTagBattery } from '../Application/AddMuTagService';

export interface AddMuTagOutput {

    showAddMuTagScreen(): void;
    showMuTagNamingScreen(): void;
    showMuTagConnectingScreen(): void;
    showMuTagFinalSetupScreen(): void;
    showActivityIndicator(): void;
    showHomeScreen(): void;
    showLowBatteryError(error: LowMuTagBattery): void;
}
