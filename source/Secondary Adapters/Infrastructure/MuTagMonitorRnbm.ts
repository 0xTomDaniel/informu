import {
    MuTagMonitor,
    MuTagSignal,
    MuTagBeacon,
    MuTagRegionExit,
    MuTagRegionEnter
} from "../../Core/Ports/MuTagMonitor";
import {
    Observable,
    Subscriber,
    Subscription,
    Subject,
    merge,
    race
} from "rxjs";
import { DeviceEventEmitter } from "react-native";
import Beacons, { BeaconRegion } from "react-native-beacons-manager";
import { BeaconId } from "../../Core/Domain/ProvisionedMuTag";
import { AccountNumber } from "../../Core/Domain/Account";
import {
    filter,
    share,
    distinctUntilKeyChanged,
    switchMap
} from "rxjs/operators";
import BackgroundTimer from "react-native-background-timer";

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

interface MuTagRegionState {
    uid: string;
    inRegion: boolean;
    timestamp: Date;
}

const ofWithDelayRn = <T>(delay: number, ...args: T[]): Observable<T> =>
    new Observable(subscriber => {
        let emittedCount = 0;
        const timeoutIds: number[] = [];
        args.forEach(value => {
            const index =
                timeoutIds.push(
                    BackgroundTimer.setTimeout(() => {
                        timeoutIds.splice(index, 1);
                        subscriber.next(value);
                        emittedCount += 1;
                        if (emittedCount === args.length) {
                            subscriber.complete();
                        }
                    }, delay)
                ) - 1;
        });
        return () =>
            timeoutIds.forEach(id => {
                BackgroundTimer.clearTimeout(id);
            });
    });

export default class MuTagMonitorRnbm implements MuTagMonitor {
    private static readonly muTagDeviceUuid =
        "de7ec7ed-1055-b055-c0de-defea7edfa7e";
    private readonly didExitRegionDelay = 25000;
    private readonly muTagMonitorSubscriptions = new Map<
        string,
        Subscription
    >();
    private readonly regionId = "Informu Beacon";

    constructor() {
        this.setup();
    }

    private readonly onMuTagDidEnterRegionRaw = new Observable<
        MuTagRegionState
    >(subscriber => {
        const subscription = DeviceEventEmitter.addListener(
            "regionDidEnter",
            ({ identifier }: BeaconRegion) => {
                subscriber.next({
                    uid: identifier,
                    inRegion: true,
                    timestamp: new Date()
                });
            }
        );
        return () => {
            subscription.remove();
        };
    }).pipe(share());
    private readonly onMuTagDidExitRegionRaw = new Observable<MuTagRegionState>(
        subscriber => {
            const subscription = DeviceEventEmitter.addListener(
                "regionDidExit",
                ({ identifier }: BeaconRegion) => {
                    subscriber.next({
                        uid: identifier,
                        inRegion: false,
                        timestamp: new Date()
                    });
                }
            );
            return () => {
                subscription.remove();
            };
        }
    ).pipe(share());
    readonly onMuTagDetection = new Observable<Set<MuTagSignal>>(
        MuTagMonitorRnbm.muTagDetectionHandler
    );
    private readonly onMuTagRegionEnterSubject = new Subject<
        MuTagRegionEnter
    >();
    readonly onMuTagRegionEnter = this.onMuTagRegionEnterSubject.asObservable();
    private readonly onMuTagRegionExitSubject = new Subject<MuTagRegionExit>();
    readonly onMuTagRegionExit = this.onMuTagRegionExitSubject.asObservable();

    async startMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void> {
        for (const muTag of muTags) {
            const onThisMuTagDidEnterRegionRaw = this.onMuTagDidEnterRegionRaw.pipe(
                filter(regionState => regionState.uid === muTag.uid)
            );
            const onThisMuTagDidExitRegionRaw = this.onMuTagDidExitRegionRaw.pipe(
                filter(regionState => regionState.uid === muTag.uid)
            );
            const subscription = merge(
                onThisMuTagDidEnterRegionRaw,
                onThisMuTagDidExitRegionRaw.pipe(
                    switchMap(regionState =>
                        race(
                            ofWithDelayRn(this.didExitRegionDelay, regionState),
                            onThisMuTagDidEnterRegionRaw
                        )
                    )
                )
            )
                .pipe(distinctUntilKeyChanged("inRegion"))
                .subscribe(regionStateChange => {
                    regionStateChange.inRegion
                        ? this.onMuTagRegionEnterSubject.next({
                              uid: muTag.uid,
                              timestamp: regionStateChange.timestamp
                          })
                        : this.onMuTagRegionExitSubject.next({
                              uid: muTag.uid,
                              timestamp: regionStateChange.timestamp
                          });
                });
            this.muTagMonitorSubscriptions.set(muTag.uid, subscription);
            const region = MuTagMonitorRnbm.getMuTagRegion(muTag);
            await Beacons.startMonitoringForRegion(region);
        }
    }

    async stopMonitoringMuTags(muTags: Set<MuTagBeacon>): Promise<void> {
        for (const muTag of muTags) {
            const region = MuTagMonitorRnbm.getMuTagRegion(muTag);
            await Beacons.stopMonitoringForRegion(region);
        }
        this.muTagMonitorSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.muTagMonitorSubscriptions.clear();
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
        const subscription = DeviceEventEmitter.addListener(
            "beaconsDidRange",
            listener
        );
        return () => subscription.remove();
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
