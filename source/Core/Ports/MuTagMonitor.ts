import { Observable } from 'rxjs';

// In the future this interface will have more data while MuTagRegionExit will not
export interface MuTagSignal {

    readonly uid: string;
    readonly timestamp: Date;
}

export interface MuTagRegionExit {

    readonly uid: string;
    readonly timestamp: Date;
}

export interface MuTagBeacon {

    readonly uid: string;
    readonly major: string;
    readonly minor: string;
}

export interface MuTagMonitor {

    readonly onMuTagDetection: Observable<Set<MuTagSignal>>;
    readonly onMuTagRegionExit: Observable<Set<MuTagRegionExit>>;
    startMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void>;
    startRangingAllMuTags(): Promise<void>;
}
