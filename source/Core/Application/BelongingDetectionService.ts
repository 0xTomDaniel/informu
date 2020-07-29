import { MuTagMonitor, MuTagSignal, MuTagBeacon } from "../Ports/MuTagMonitor";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import ProvisionedMuTag from "../Domain/ProvisionedMuTag";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { Subscription } from "rxjs";
import { MuTagsChange } from "../Domain/Account";

export interface BelongingDetection {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export default class BelongingDetectionService implements BelongingDetection {
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private hasStarted = false;
    private readonly muTagMonitor: MuTagMonitor;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private muTagsChangeSubscription?: Subscription;
    private muTagDetectionSubscription?: Subscription;
    private muTagRegionExitSubscription?: Subscription;

    constructor(
        muTagMonitor: MuTagMonitor,
        muTagRepoLocal: MuTagRepositoryLocal,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.muTagMonitor = muTagMonitor;
        this.muTagRepoLocal = muTagRepoLocal;
        this.accountRepoLocal = accountRepoLocal;
    }

    async start(): Promise<void> {
        if (this.hasStarted) {
            return;
        }
        this.hasStarted = true;
        this.updateMuTagsWhenDetected();
        this.updateMuTagsWhenRegionExited();
        const muTags = await this.muTagRepoLocal.getAll();
        await this.startMonitoringMuTags(muTags);
        await this.muTagMonitor.startRangingAllMuTags();
        this.controlMonitoringForMuTagChanges();
    }

    async stop(): Promise<void> {
        if (!this.hasStarted) {
            return;
        }
        await this.muTagMonitor.stopAllMonitoringAndRanging();
        this.muTagsChangeSubscription?.unsubscribe();
        this.muTagDetectionSubscription?.unsubscribe();
        this.muTagRegionExitSubscription?.unsubscribe();
        this.hasStarted = false;
    }

    private async controlMonitoringForMuTagChanges(): Promise<void> {
        const account = await this.accountRepoLocal.get();
        const observer = (change: MuTagsChange): void => {
            if (change.insertion != null) {
                this.muTagRepoLocal
                    .getByUid(change.insertion)
                    .then(
                        (muTag): Promise<void> => {
                            return this.startMonitoringMuTags(new Set([muTag]));
                        }
                    )
                    .catch((e): void => {
                        console.warn(`muTagRepoLocal.getByUid() - error: ${e}`);
                    });
            }
            if (change.deletion != null) {
                this.muTagRepoLocal
                    .getByUid(change.deletion)
                    .then(
                        (muTag): Promise<void> => {
                            return this.stopMonitoringMuTags(new Set([muTag]));
                        }
                    )
                    .catch((e): void => {
                        console.warn(`muTagRepoLocal.getByUid() - error: ${e}`);
                    });
            }
        };
        this.muTagsChangeSubscription = account.muTagsChange.subscribe(
            observer
        );
    }

    private async startMonitoringMuTags(
        muTags: Set<ProvisionedMuTag>
    ): Promise<void> {
        const beacons = await this.getBeaconsFromMuTags(muTags);
        this.muTagMonitor.startMonitoringMuTags(beacons);
    }

    private async stopMonitoringMuTags(
        muTags: Set<ProvisionedMuTag>
    ): Promise<void> {
        const beacons = await this.getBeaconsFromMuTags(muTags);
        this.muTagMonitor.stopMonitoringMuTags(beacons);
    }

    private updateMuTagsWhenDetected(): void {
        this.muTagDetectionSubscription = this.muTagMonitor.onMuTagDetection.subscribe(
            (detectedMuTags): void => {
                detectedMuTags.forEach((muTagSignal): void => {
                    this.updateDetectedMuTag(muTagSignal).catch((e): void => {
                        console.warn(`updateDetectedMuTag() - error: ${e}`);
                    });
                });
            }
        );
    }

    private updateMuTagsWhenRegionExited(): void {
        this.muTagRegionExitSubscription = this.muTagMonitor.onMuTagRegionExit.subscribe(
            (exitedMuTag): void => {
                this.updateExitedMuTag(exitedMuTag.uid).catch((e): void => {
                    console.warn(`updateExitedMuTag() - error: ${e}`);
                });
            }
        );
    }

    private async updateDetectedMuTag(muTagSignal: MuTagSignal): Promise<void> {
        const account = await this.accountRepoLocal.get();
        const accountNumber = account.accountNumber;
        if (muTagSignal.accountNumber.valueOf() !== accountNumber.valueOf()) {
            return;
        }

        const muTag = await this.muTagRepoLocal.getByBeaconId(
            muTagSignal.beaconId
        );
        muTag.userDidDetect(muTagSignal.timestamp);
        this.muTagRepoLocal.update(muTag);
    }

    private async updateExitedMuTag(uid: string): Promise<void> {
        const muTag = await this.muTagRepoLocal.getByUid(uid);
        muTag.userDidExitRegion();
        this.muTagRepoLocal.update(muTag);
    }

    private async getBeaconsFromMuTags(
        muTags: Set<ProvisionedMuTag>
    ): Promise<Set<MuTagBeacon>> {
        const account = await this.accountRepoLocal.get();
        const accountNumber = account.accountNumber;
        const beacons = new Set(
            Array.from(muTags).map(
                (muTag): MuTagBeacon => {
                    return {
                        uid: muTag.uid,
                        accountNumber: accountNumber,
                        beaconId: muTag.beaconId
                    };
                }
            )
        );
        return beacons;
    }
}
