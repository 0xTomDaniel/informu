import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { Bluetooth } from '../Ports/Bluetooth';
import { RSSI } from '../Domain/Types';
import Percent from '../Domain/Percent';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';

export class LowMuTagBattery extends Error {

    constructor(lowBatteryThreshold: number) {
        super('Unable to add Mu tag because its battery is below ' +
        `${lowBatteryThreshold}%. Please charge Mu tag and try again.`);
        this.name = 'LowMuTagBattery';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NewMuTagNotFound extends Error {

    constructor() {
        super('A new Mu tag could not be found.');
        this.name = 'NewMuTagNotFound';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AddMuTagTimedOut extends Error {

    constructor() {
        super('Mu tag has went to sleep and could not be added. Please try adding again.');
        this.name = 'AddMuTagTimedOut';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class AddMuTagService {

    private scanThreshold: RSSI;
    private addMuTagBatteryThreshold: Percent;
    private addMuTagOutput: AddMuTagOutput;
    private bluetooth: Bluetooth;
    private muTagRepoLocal: MuTagRepositoryLocal;
    private muTagRepoRemote: MuTagRepositoryRemote;

    private unprovisionedMuTag: UnprovisionedMuTag | undefined;

    constructor(
        scanThreshold: RSSI,
        addMuTagBatteryThreshold: Percent,
        addMuTagOutput: AddMuTagOutput,
        bluetooth: Bluetooth,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
    ) {
        this.scanThreshold = scanThreshold;
        this.addMuTagBatteryThreshold = addMuTagBatteryThreshold;
        this.addMuTagOutput = addMuTagOutput;
        this.bluetooth = bluetooth;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
    }

    async connectToNewMuTag(): Promise<void> {
        this.addMuTagOutput.showAddMuTagScreen();

        try {
            this.unprovisionedMuTag = await this.bluetooth.findNewMuTag(this.scanThreshold);
            this.bluetooth.connectToMuTag(this.unprovisionedMuTag);

            if (this.unprovisionedMuTag.batteryLevel < this.addMuTagBatteryThreshold) {
                throw new LowMuTagBattery(this.addMuTagBatteryThreshold.value);
            }

            this.addMuTagOutput.showMuTagSetupScreen();
        } catch (e) {
            throw e;
        }
    }

    async addConnectedMuTag(attachedTo: string): Promise<void> {
        try {
            if (this.unprovisionedMuTag == null) {
                throw new NewMuTagNotFound();
            }

            const provisionedMuTag = await this.bluetooth.provisionMuTag(this.unprovisionedMuTag);
            await this.muTagRepoLocal.add(provisionedMuTag);
            await this.muTagRepoRemote.add(provisionedMuTag);

            this.addMuTagOutput.showHomeScreen();
        } catch (e) {
            throw e;
        }
    }
}
