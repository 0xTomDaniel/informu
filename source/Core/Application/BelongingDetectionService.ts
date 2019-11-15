import { MuTagMonitor, MuTagSignal, MuTagBeacon } from '../Ports/MuTagMonitor';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountNumber } from '../Domain/Account';

export interface BelongingDetection {

    start(): Promise<void>;
}

export default class BelongingDetectionService implements BelongingDetection {

    private readonly muTagMonitor: MuTagMonitor;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        muTagMonitor: MuTagMonitor,
        muTagRepoLocal: MuTagRepositoryLocal,
        accountRepoLocal: AccountRepositoryLocal,
    ) {
        this.muTagMonitor = muTagMonitor;
        this.muTagRepoLocal = muTagRepoLocal;
        this.accountRepoLocal = accountRepoLocal;
    }

    async start(): Promise<void> {
        this.updateMuTagsWhenDetected();
        this.updateMuTagsWhenRegionExited();
        const muTags = await this.muTagRepoLocal.getAll();
        const beacons = await this.getBeaconsFromMuTags(muTags);
        await this.muTagMonitor.startMonitoringMuTags(beacons);
        await this.muTagMonitor.startRangingAllMuTags();
    }

    private updateMuTagsWhenDetected(): void {
        this.muTagMonitor.onMuTagDetection.subscribe((detectedMuTags): void => {
            detectedMuTags.forEach((muTagSignal): void => {
                this.updateDetectedMuTag(muTagSignal).catch((e): void => {
                    console.warn(e);
                });
            });
        });
    }

    private updateMuTagsWhenRegionExited(): void {
        this.muTagMonitor.onMuTagRegionExit.subscribe((exitedMuTag): void => {
            this.updateExitedMuTag(exitedMuTag.uid).catch((e): void => {
                console.warn(e);
            });
        });
    }

    private async updateDetectedMuTag(muTagSignal: MuTagSignal): Promise<void> {
        const account = await this.accountRepoLocal.get();
        const accountNumber = account.getAccountNumber();
        if (muTagSignal.accountNumber.valueOf() !== accountNumber.valueOf()) {
            return;
        }

        const muTag = await this.muTagRepoLocal.getByBeaconID(muTagSignal.beaconID);
        muTag.userDidDetect(muTagSignal.timestamp);
        this.muTagRepoLocal.update(muTag);
    }

    private async updateExitedMuTag(uid: string): Promise<void> {
        const muTag = await this.muTagRepoLocal.getByUID(uid);
        muTag.userDidExitRegion();
        this.muTagRepoLocal.update(muTag);
    }

    private async getBeaconsFromMuTags(muTags: Set<ProvisionedMuTag>): Promise<Set<MuTagBeacon>> {
        const account = await this.accountRepoLocal.get();
        const accountNumber = account.getAccountNumber();
        const beacons = new Set(Array.from(muTags).map((muTag): MuTagBeacon => {
            return { uid: muTag.uid, accountNumber: accountNumber, beaconID: muTag.beaconID };
        }));
        return beacons;
    }
}
