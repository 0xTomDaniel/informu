import { MuTagDevices, MuTagNotFound, UnprovisionMuTagFailed } from '../Ports/MuTagDevices';
import Percent from '../Domain/Percent';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { RemoveMuTagOutput } from '../Ports/RemoveMuTagOutput';

export class LowMuTagBattery extends Error {

    constructor(lowBatteryThreshold: number) {
        super('Unable to remove Mu tag because its battery is below ' +
        `${lowBatteryThreshold}%. Please charge Mu tag and try again.`);
        this.name = 'LowMuTagBattery';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class RemoveMuTagService {

    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly muTagDevices: MuTagDevices;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly removeMuTagOutput: RemoveMuTagOutput;

    constructor(
        removeMuTagBatteryThreshold: Percent,
        muTagDevices: MuTagDevices,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        removeMuTagOutput: RemoveMuTagOutput,
    ) {
        this.removeMuTagBatteryThreshold = removeMuTagBatteryThreshold;
        this.muTagDevices = muTagDevices;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.removeMuTagOutput = removeMuTagOutput;
    }

    async remove(uid: string): Promise<void> {
        this.removeMuTagOutput.showBusyIndicator();

        try {
            const batteryLevel = await this.muTagDevices.readBatteryLevel(uid);
            if (batteryLevel <= this.removeMuTagBatteryThreshold) {
                throw new LowMuTagBattery(this.removeMuTagBatteryThreshold.valueOf());
            }

            await this.muTagDevices.unprovisionMuTag(uid);

            const account = await this.accountRepoLocal.get();
            const muTag = await this.muTagRepoLocal.getByUID(uid);
            account.removeMuTag(uid, muTag.beaconID);

            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUID(uid);
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUID(uid, account.uid);
        } catch (e) {
            switch (e.constructor) {
                case LowMuTagBattery:
                    this.removeMuTagOutput.showLowBatteryError(e);
                    break;
                case MuTagNotFound:
                    this.removeMuTagOutput.showMuTagNotFoundError(e);
                    break;
                case UnprovisionMuTagFailed:
                    this.removeMuTagOutput.showUnprovisionMuTagFailedError(e);
                    break;
                default:
                    this.removeMuTagOutput.showUnknownError(e);
            }
        } finally {
            this.removeMuTagOutput.hideBusyIndicator();
        }
    }
}
