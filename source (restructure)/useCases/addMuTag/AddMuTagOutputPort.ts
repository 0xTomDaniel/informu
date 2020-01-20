import { LowMuTagBattery } from "./AddMuTagInteractor";
import {
    ProvisionMuTagFailed,
    NewMuTagNotFound,
    BluetoothUnsupported
} from "./MuTagDevicesPort";

export interface AddMuTagOutputPort {
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
    showError(error: Error): void;
}
