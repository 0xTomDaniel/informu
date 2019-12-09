import { Observable } from "rxjs";
import { BeaconID } from "../Domain/ProvisionedMuTag";
import { AccountNumber } from "../Domain/Account";

// In the future this interface will have more data while MuTagRegionExit will not
export interface MuTagSignal {
    readonly accountNumber: AccountNumber;
    readonly beaconID: BeaconID;
    readonly timestamp: Date;
}

export interface MuTagRegionExit {
    readonly uid: string;
    readonly timestamp: Date;
}

export interface MuTagBeacon {
    readonly uid: string;
    readonly accountNumber: AccountNumber;
    readonly beaconID: BeaconID;
}

export interface MuTagMonitor {
    readonly onMuTagDetection: Observable<Set<MuTagSignal>>;
    readonly onMuTagRegionExit: Observable<MuTagRegionExit>;
    startMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void>;
    stopMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void>;
    startRangingAllMuTags(): Promise<void>;
    stopAllMonitoringAndRanging(): Promise<void>;
}
