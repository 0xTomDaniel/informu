import { BeaconID } from '../Domain/ProvisionedMuTag';
import { Observable } from 'rxjs';

export interface MuTagSignal {

    beaconID: BeaconID;
    timestamp: Date;
}

export interface MuTagMonitor {

    readonly onMuTagDetection: Observable<MuTagSignal[]>;
    readonly onMuTagRegionExit: Observable<BeaconID[]>;
}
