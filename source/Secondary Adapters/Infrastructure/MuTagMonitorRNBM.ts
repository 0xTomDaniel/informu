import { MuTagMonitor, MuTagSignal, MuTagBeacon, MuTagRegionExit } from '../../Core/Ports/MuTagMonitor';
import { Observable, Subscriber } from 'rxjs';
import { DeviceEventEmitter } from 'react-native';
import Beacons, { BeaconRegion } from 'react-native-beacons-manager';

export default class MuTagMonitorRNBM implements MuTagMonitor {

    private readonly regionID = 'Informu Beacon';
    private readonly muTagDeviceUUID = 'de7ec7ed-1055-b055-c0de-defea7edfa7e';

    constructor() {
        this.setup();
    }

    readonly onMuTagDetection = new Observable<Set<MuTagSignal>>(this.onMuTagDetectionBehavior)
    readonly onMuTagRegionExit = new Observable<Set<MuTagRegionExit>>()

    async startMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void> {
        for (const muTag of muTags) {
            const major = parseInt(muTag.major, 16);
            const minor = parseInt(muTag.minor, 16);
            const region: BeaconRegion = {
                identifier: muTag.uid,
                uuid: this.muTagDeviceUUID,
                minor: major,
                major: minor,
            };
            await Beacons.startMonitoringForRegion(region);
        }
    }

    async startRangingAllMuTags(): Promise<void> {
        await Beacons.startRangingBeaconsInRegion(this.regionID, this.muTagDeviceUUID);
    }

    private setup(): void {
        Beacons.detectIBeacons();
    }

    private onMuTagDetectionBehavior(subscriber: Subscriber<Set<MuTagRegionExit>>): void {
        DeviceEventEmitter.addListener('beaconsDidRange', (data): void => {
            console.log('Found beacons!', data.beacons);
        });
    }
}
