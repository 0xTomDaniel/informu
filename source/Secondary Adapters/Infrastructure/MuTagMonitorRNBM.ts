import {
    MuTagMonitor,
    MuTagSignal,
    MuTagBeacon,
    MuTagRegionExit
} from "../../Core/Ports/MuTagMonitor";
import { Observable, Subscriber } from "rxjs";
import { DeviceEventEmitter } from "react-native";
import Beacons, { BeaconRegion } from "react-native-beacons-manager";
import { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import { AccountNumber } from "../../Core/Domain/Account";

interface RangedRegion {
    region: string;
    uuid?: string;
}

interface RangedBeacon {
    distance: number;
    major: number;
    minor: number;
    proximity: string;
    rssi: number;
    uuid: string;
}

interface RangedBeaconData {
    identifier: string;
    uuid: string;
    beacons: [RangedBeacon];
}

export default class MuTagMonitorRnbm implements MuTagMonitor {
    private static readonly muTagDeviceUuid =
        "de7ec7ed-1055-b055-c0de-defea7edfa7e";
    private readonly regionId = "Informu Beacon";

    constructor() {
        this.setup();
    }

    readonly onMuTagDetection = new Observable<Set<MuTagSignal>>(
        MuTagMonitorRnbm.muTagDetectionHandler
    );
    readonly onMuTagRegionExit = new Observable<MuTagRegionExit>(
        MuTagMonitorRnbm.muTagRegionExitHandler
    );

    async startMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void> {
        for (const muTag of muTags) {
            const region = MuTagMonitorRnbm.getMuTagRegion(muTag);
            await Beacons.startMonitoringForRegion(region);
        }
    }

    async stopMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void> {
        for (const muTag of muTags) {
            const region = MuTagMonitorRnbm.getMuTagRegion(muTag);
            await Beacons.stopMonitoringForRegion(region);
        }
    }

    async startRangingAllMuTags(): Promise<void> {
        const isMuTagRegionRanging = await this.isMuTagRegionRanging();
        if (!isMuTagRegionRanging) {
            await Beacons.startRangingBeaconsInRegion(
                this.regionId,
                MuTagMonitorRnbm.muTagDeviceUuid
            );
        }
    }

    async stopAllMonitoringAndRanging(): Promise<void> {
        const monitoredRegions = await Beacons.getMonitoredRegions();
        for (const region of monitoredRegions) {
            await Beacons.stopMonitoringForRegion(region);
        }
        await Beacons.stopRangingBeaconsInRegion(
            this.regionId,
            MuTagMonitorRnbm.muTagDeviceUuid
        );
    }

    private async isMuTagRegionRanging(): Promise<boolean> {
        const rangedRegions: RangedRegion[] = await Beacons.getRangedRegions();
        const muTagRegion = rangedRegions.find((rangedRegion): boolean => {
            return (
                rangedRegion.region === this.regionId &&
                rangedRegion.uuid === MuTagMonitorRnbm.muTagDeviceUuid
            );
        });
        return muTagRegion != null;
    }

    private setup(): void {
        Beacons.detectIBeacons();
    }

    private static muTagDetectionHandler(
        subscriber: Subscriber<Set<MuTagSignal>>
    ): () => void {
        const listener = (data: RangedBeaconData): void => {
            const muTagSignals = MuTagMonitorRnbm.getMuTagSignals(data);
            if (muTagSignals.size > 0) {
                subscriber.next(muTagSignals);
            }
        };
        const emitterSubscription = DeviceEventEmitter.addListener(
            "beaconsDidRange",
            listener
        );
        return function unsubscribe(): void {
            emitterSubscription.remove();
        };
    }

    private static muTagRegionExitHandler(
        subscriber: Subscriber<MuTagRegionExit>
    ): () => void {
        const listener = ({ identifier }: BeaconRegion): void => {
            subscriber.next({ uid: identifier, timestamp: new Date() });
        };
        const emitterSubscription = DeviceEventEmitter.addListener(
            "regionDidExit",
            listener
        );
        return function unsubscribe(): void {
            emitterSubscription.remove();
        };
    }

    private static getMuTagRegion(muTag: MuTagBeacon): BeaconRegion {
        const major = MuTagMonitorRnbm.getMajor(muTag.accountNumber);
        const minor = MuTagMonitorRnbm.getMinor(
            muTag.accountNumber,
            muTag.beaconId
        );
        return {
            identifier: muTag.uid,
            uuid: this.muTagDeviceUuid,
            minor: minor,
            major: major
        };
    }

    private static getMajor(accountNumber: AccountNumber): number {
        const majorHex = accountNumber.toString().substr(0, 4);
        return parseInt(majorHex, 16);
    }

    private static getMinor(
        accountNumber: AccountNumber,
        beaconId: BeaconId
    ): number {
        const majorMinorHex = accountNumber.toString() + beaconId.toString();
        const minorHex = majorMinorHex.toString().substr(4, 4);
        return parseInt(minorHex, 16);
    }

    private static getMuTagSignals(
        rangedBeaconData: RangedBeaconData
    ): Set<MuTagSignal> {
        const now = new Date();
        return new Set(
            rangedBeaconData.beacons.map(
                (rangedBeacon): MuTagSignal => {
                    return {
                        accountNumber: this.getAccountNumber(
                            rangedBeacon.major,
                            rangedBeacon.minor
                        ),
                        beaconId: this.getBeaconId(rangedBeacon.minor),
                        timestamp: now
                    };
                }
            )
        );
    }

    private static getAccountNumber(
        major: number,
        minor: number
    ): AccountNumber {
        const majorMinorHex =
            major.toString(16).padStart(4, "0") +
            minor.toString(16).padStart(4, "0");
        return AccountNumber.fromString(majorMinorHex.substr(0, 7));
    }

    private static getBeaconId(minor: number): BeaconId {
        const minorHex = minor.toString(16).padStart(4, "0");
        return BeaconId.create(minorHex.substr(3, 1));
    }
}
