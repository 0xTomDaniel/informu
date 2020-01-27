import {
    MuTagDevicesPort,
    MuTagNotFound,
    UnprovisionMuTagFailed
} from "../addMuTag/MuTagDevicesPort";
import Percent from "../../shared/metaLanguage/Percent";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import { MuTagRepositoryLocal } from "../../../source/Core/Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../../../source/Core/Ports/MuTagRepositoryRemote";
import { AccountRepositoryRemote } from "../../../source/Core/Ports/AccountRepositoryRemote";
import { RemoveMuTagOutputPort } from "./RemoveMuTagOutputPort";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";

export class LowMuTagBattery extends Error {
    constructor(lowBatteryThreshold: number) {
        super(
            "Unable to remove Mu tag because its battery is below " +
                `${lowBatteryThreshold}%. Please charge Mu tag and try again.`
        );
        this.name = "LowMuTagBattery";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class RemoveMuTagInteractor {
    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly removeMuTagOutput: RemoveMuTagOutputPort;

    constructor(
        removeMuTagBatteryThreshold: Percent,
        muTagDevices: MuTagDevicesPort,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        removeMuTagOutput: RemoveMuTagOutputPort
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

        let account: Account | undefined;
        let muTag: ProvisionedMuTag | undefined;

        try {
            account = await this.accountRepoLocal.get();
            muTag = await this.muTagRepoLocal.getByUID(uid);

            await this.muTagDevices.connectToProvisionedMuTag(
                account.accountNumber,
                muTag.beaconID
            );
            const batteryLevel = await this.muTagDevices.readBatteryLevel(
                account.accountNumber,
                muTag.beaconID
            );
            if (batteryLevel <= this.removeMuTagBatteryThreshold) {
                throw new LowMuTagBattery(
                    this.removeMuTagBatteryThreshold.valueOf()
                );
            }

            await this.muTagDevices.unprovisionMuTag(
                account.accountNumber,
                muTag.beaconID
            );

            account.removeMuTag(uid, muTag.beaconID);

            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUID(uid);
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUID(uid, account.uid);
        } catch (e) {
            if (
                e.constructor !== MuTagNotFound &&
                account != null &&
                muTag != null
            ) {
                this.muTagDevices.disconnectFromProvisionedMuTag(
                    account.accountNumber,
                    muTag.beaconID
                );
            }

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
