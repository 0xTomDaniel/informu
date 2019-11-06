import { MuTagMonitor, MuTagSignal } from '../Ports/MuTagMonitor';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { BeaconID } from '../Domain/ProvisionedMuTag';

export default class BelongingDetectionService {

    private readonly muTagMonitor: MuTagMonitor;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;

    constructor(muTagMonitor: MuTagMonitor, muTagRepoLocal: MuTagRepositoryLocal) {
        this.muTagMonitor = muTagMonitor;
        this.muTagRepoLocal = muTagRepoLocal;
    }

    start(): void {
        this.updateMuTagsWhenDetected();
        this.updateMuTagsWhenRegionExited();
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
                this.updateExitedMuTag(muTag).catch((e): void => {
                    console.warn(e);
                });
            });
        });
    }

    private async updateDetectedMuTag(muTagSignal: MuTagSignal): Promise<void> {
        const muTag = await this.muTagRepoLocal.getByBeaconID(muTagSignal.beaconID);
        muTag.userDidDetect(muTagSignal.timestamp);
        this.muTagRepoLocal.update(muTag);
    }

    private async updateExitedMuTag(beaconID: BeaconID): Promise<void> {
        const muTag = await this.muTagRepoLocal.getByBeaconID(beaconID);
        muTag.userDidExitRegion();
        this.muTagRepoLocal.update(muTag);
    }
}
