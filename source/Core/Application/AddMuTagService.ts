import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { Bluetooth } from '../Ports/Bluetooth';
import { RSSI } from '../Domain/Types';
import Percent from '../Domain/Percent';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { MuTagColor } from '../Domain/MuTag';

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

export class AddedMuTagNotFound extends Error {

    constructor() {
        super('There was no added Mu tag found.');
        this.name = 'AddedMuTagNotFound';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class AddMuTagService {

    private readonly connectThreshold: RSSI;
    private readonly addMuTagBatteryThreshold: Percent;
    private readonly addMuTagOutput: AddMuTagOutput;
    private readonly bluetooth: Bluetooth;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;

    private unprovisionedMuTag: UnprovisionedMuTag | undefined;
    private provisionedMuTag: ProvisionedMuTag | undefined;
    private muTagName: string | undefined;

    constructor(
        connectThreshold: RSSI,
        addMuTagBatteryThreshold: Percent,
        addMuTagOutput: AddMuTagOutput,
        bluetooth: Bluetooth,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
    ) {
        this.connectThreshold = connectThreshold;
        this.addMuTagBatteryThreshold = addMuTagBatteryThreshold;
        this.addMuTagOutput = addMuTagOutput;
        this.bluetooth = bluetooth;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
    }

    async startAddingNewMuTag(): Promise<void> {
        this.addMuTagOutput.showAddMuTagScreen();

        try {
            this.unprovisionedMuTag = await this.bluetooth.connectToNewMuTag(this.connectThreshold);

            if (!this.unprovisionedMuTag.isBatteryAbove(this.addMuTagBatteryThreshold)) {
                const error = new LowMuTagBattery(this.addMuTagBatteryThreshold.valueOf());
                this.addMuTagOutput.showLowBatteryError(error);
                return;
            }

            if (this.muTagName != null) {
                await this.addNewMuTag(this.unprovisionedMuTag, this.muTagName);
            }
        } catch (e) {
            throw e;
        }
    }

    async stopAddingNewMuTag(): Promise<void> {
        this.addMuTagOutput.showHomeScreen();
        this.resetAddNewMuTagState();

        try {
            await this.bluetooth.cancelConnectToNewMuTag();
        } catch (e) {
            throw e;
        }
    }

    instructionsComplete(): void {
        this.addMuTagOutput.showMuTagNamingScreen();
    }

    async setMuTagName(name: string): Promise<void> {
        this.addMuTagOutput.showActivityIndicator();

        if (this.unprovisionedMuTag != null) {
            await this.addNewMuTag(this.unprovisionedMuTag, name);
        } else {
            this.muTagName = name;
            this.addMuTagOutput.showMuTagConnectingScreen();
        }
    }

    async completeMuTagSetup(color: MuTagColor): Promise<void> {
        try {
            if (this.provisionedMuTag == null) {
                throw new AddedMuTagNotFound();
            }

            this.addMuTagOutput.showActivityIndicator();

            this.provisionedMuTag.updateColor(color);
            await this.muTagRepoLocal.update(this.provisionedMuTag);
            await this.muTagRepoRemote.update(this.provisionedMuTag);

            this.resetAddNewMuTagState();
            this.addMuTagOutput.showHomeScreen();
        } catch (e) {
            throw e;
        }
    }

    private async addNewMuTag(unprovisionedMuTag: UnprovisionedMuTag, name: string): Promise<void> {
        this.provisionedMuTag = await this.bluetooth.provisionMuTag(unprovisionedMuTag, name);
        this.unprovisionedMuTag = undefined;
        await this.muTagRepoLocal.add(this.provisionedMuTag);
        await this.muTagRepoRemote.add(this.provisionedMuTag);

        this.addMuTagOutput.showMuTagFinalSetupScreen();
    }

    private resetAddNewMuTagState(): void {
        this.unprovisionedMuTag = undefined;
        this.provisionedMuTag = undefined;
        this.muTagName = undefined;
    }
}
