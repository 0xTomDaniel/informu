import { LowMuTagBattery } from '../Application/AddMuTagService';
import { ProvisionMuTagFailed, NewMuTagNotFound, BluetoothUnsupported } from './MuTagDevices';

export interface AddMuTagOutput {

    showAddMuTagScreen(): void;
    showMuTagNamingScreen(): void;
    showMuTagConnectingScreen(): void;
    showMuTagFinalSetupScreen(): void;
    showActivityIndicator(): void;
    showHomeScreen(): void;
    showLowBatteryError(error: LowMuTagBattery): void;
    showFindNewMuTagError(error: NewMuTagNotFound): void;
    showProvisionFailedError(error: ProvisionMuTagFailed): void;
    showBluetoothUnsupportedError(error: BluetoothUnsupported): void;
}
