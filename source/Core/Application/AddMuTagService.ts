import { AddMuTagOutput } from '../Ports/AddMuTagOutput';
import { MuTagDevices, ProvisionMuTagFailed, NewMuTagNotFound, BluetoothUnsupported, FindNewMuTagCanceled } from '../Ports/MuTagDevices';
import { RSSI } from '../Domain/Types';
import Percent from '../Domain/Percent';
import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { MuTagColor } from '../Domain/MuTag';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';

export class LowMuTagBattery extends Error {

    constructor(lowBatteryThreshold: number) {
        super('Unable to add Mu tag because its battery is below ' +
        `${lowBatteryThreshold}%. Please charge Mu tag and try again.`);
        this.name = 'LowMuTagBattery';
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
    private readonly muTagDevices: MuTagDevices;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;

    private unprovisionedMuTag: UnprovisionedMuTag | undefined;
    private provisionedMuTag: ProvisionedMuTag | undefined;
    private muTagName: string | undefined;
    private accountUID: string | undefined;

    constructor(
        connectThreshold: RSSI,
        addMuTagBatteryThreshold: Percent,
        addMuTagOutput: AddMuTagOutput,
        muTagDevices: MuTagDevices,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
    ) {
        this.connectThreshold = connectThreshold;
        this.addMuTagBatteryThreshold = addMuTagBatteryThreshold;
        this.addMuTagOutput = addMuTagOutput;
        this.muTagDevices = muTagDevices;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
    }

    async startAddingNewMuTag(): Promise<void> {
        this.addMuTagOutput.showAddMuTagScreen();

        try {
            this.unprovisionedMuTag = await this.muTagDevices
                .findNewMuTag(this.connectThreshold);

            if (!this.unprovisionedMuTag.isBatteryAboveThreshold(this.addMuTagBatteryThreshold)) {
                const error = new LowMuTagBattery(this.addMuTagBatteryThreshold.valueOf());
                this.addMuTagOutput.showLowBatteryError(error);
                return;
            }

            if (this.muTagName != null) {
                await this.addNewMuTag(this.unprovisionedMuTag, this.muTagName);
            }
        } catch (e) {
            switch (e.constructor) {
                case NewMuTagNotFound:
                    this.addMuTagOutput.showFindNewMuTagError(e);
                    break;
                case ProvisionMuTagFailed:
                    this.addMuTagOutput.showProvisionFailedError(e);
                    break;
                case BluetoothUnsupported:
                    this.addMuTagOutput.showBluetoothUnsupportedError(e);
                    break;
                case FindNewMuTagCanceled: break;
                default:
                    throw e;
            }
        }
    }

    stopAddingNewMuTag(): void {
        this.addMuTagOutput.showHomeScreen();
        this.resetAddNewMuTagState();
        this.muTagDevices.cancelFindNewMuTag();
    }

    instructionsComplete(): void {
        this.addMuTagOutput.showMuTagNamingScreen();
    }

    async setMuTagName(name: string): Promise<void> {
        this.addMuTagOutput.showActivityIndicator();

        if (this.unprovisionedMuTag != null) {
            try {
                await this.addNewMuTag(this.unprovisionedMuTag, name);
            } catch (e) {
                switch (e.constructor) {
                    case ProvisionMuTagFailed:
                        this.addMuTagOutput.showProvisionFailedError(e);
                        break;
                    default:
                        throw e;
                }
            }
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

            this.provisionedMuTag.changeColor(color);
            await this.muTagRepoLocal.update(this.provisionedMuTag);
            const accountUID = await this.getAccountUID();
            await this.muTagRepoRemote.update(this.provisionedMuTag, accountUID);

            this.resetAddNewMuTagState();
            this.addMuTagOutput.showHomeScreen();
        } catch (e) {
            throw e;
        }
    }

    private async addNewMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        name: string
    ): Promise<void> {
        const account = await this.accountRepoLocal.get();
        const beaconID = account.newBeaconID;
        const accountNumber = account.accountNumber;
        const muTagNumber = account.newMuTagNumber;
        this.provisionedMuTag = await this.muTagDevices.provisionMuTag(
            unprovisionedMuTag,
            accountNumber,
            beaconID,
            muTagNumber,
            name,
        );
        this.unprovisionedMuTag = undefined;
        await this.muTagRepoLocal.add(this.provisionedMuTag);
        this.accountUID = account.uid;
        await this.muTagRepoRemote.add(this.provisionedMuTag, this.accountUID);

        account.addNewMuTag(this.provisionedMuTag.uid, beaconID);
        await this.accountRepoLocal.update(account);
        await this.accountRepoRemote.update(account);

        this.addMuTagOutput.showMuTagFinalSetupScreen();
    }

    private resetAddNewMuTagState(): void {
        this.unprovisionedMuTag = undefined;
        this.provisionedMuTag = undefined;
        this.muTagName = undefined;
        this.accountUID = undefined;
    }

    private async getAccountUID(): Promise<string> {
        if (this.accountUID == null) {
            const account = await this.accountRepoLocal.get();
            this.accountUID = account.uid;
        }

        return this.accountUID;
    }
}
