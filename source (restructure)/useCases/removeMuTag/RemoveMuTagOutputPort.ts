import {
    MuTagNotFound,
    UnprovisionMuTagFailed
} from "../addMuTag/MuTagDevicesPort";
import { LowMuTagBattery } from "./RemoveMuTagInteractor";

export interface RemoveMuTagOutputPort {
    showBusyIndicator(): void;
    hideBusyIndicator(): void;
    showMuTagNotFoundError(error: MuTagNotFound): void;
    showUnprovisionMuTagFailedError(error: UnprovisionMuTagFailed): void;
    showLowBatteryError(error: LowMuTagBattery): void;
    showUnknownError(error: Error): void;
}
