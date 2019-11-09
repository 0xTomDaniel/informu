import { MuTagMonitor, MuTagSignal, MuTagBeacon } from '../Ports/MuTagMonitor';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import ProvisionedMuTag, { BeaconID } from '../Domain/ProvisionedMuTag';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountNumber } from '../Domain/Account';

export default class BelongingDetectionService {

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
        this.muTagMonitor.onMuTagRegionExit.subscribe((muTagsExited): void => {
            muTagsExited.forEach((muTag): void => {
                this.updateExitedMuTag(muTag.uid).catch((e): void => {
                    console.warn(e);
                });
            });
        });
    }

    private async updateDetectedMuTag(muTagSignal: MuTagSignal): Promise<void> {
        const muTag = await this.muTagRepoLocal.getByUID(muTagSignal.uid);
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
            const major = BelongingDetectionService.getMajor(accountNumber);
            const minor = BelongingDetectionService.getMinor(accountNumber, muTag.beaconID);
            return { uid: muTag.uid, major: major, minor: minor };
        }));
        return beacons;
    }

    private static getMajor(accountNumber: AccountNumber): string {
        return accountNumber.toString().substr(0, 4);
    }

    private static getMinor(accountNumber: AccountNumber, beaconID: BeaconID): string {
        const majorMinorHex = accountNumber.toString() + beaconID.toString();
        return majorMinorHex.toString().substr(4, 4);
    }
}
