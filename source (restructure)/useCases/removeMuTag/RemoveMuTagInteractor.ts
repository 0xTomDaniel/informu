import Percent from "../../shared/metaLanguage/Percent";
import { RemoveMuTagOutputPort } from "./RemoveMuTagOutputPort";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import MuTagDevicesPort from "./MuTagDevicesPort";
import UserError from "../../shared/metaLanguage/UserError";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";

export class LowMuTagBattery extends UserError {
    name = "LowMuTagBattery";
    userErrorDescription: string;
    constructor(
        lowBatteryThreshold: number,
        originatingError?: Error | undefined
    ) {
        super(originatingError);
        this.userErrorDescription = `Unable to remove Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`;
    }
}

export class FailedToConnectToMuTag extends UserError {
    name = "FailedToConnectToMuTag";
    userErrorDescription =
        "Could not connect to Mu tag. Please ensure that Mu tag is charged and move it closer to the app.";
}

export class MuTagCommunicationFailure extends UserError {
    name = "MuTagCommunicationFailure";
    userErrorDescription =
        "There was a problem communicating with the Mu tag. Please move Mu tag closer to the app.";
}

export class FailedToRemoveMuTagFromAccount extends UserError {
    name = "FailedToRemoveMuTagFromAccount";
    userErrorDescription =
        "The Mu tag device successfully reset and disconnected from your account, but there was a problem removing the Mu tag from the app. Please notify support@informu.io.";
}

export default class RemoveMuTagInteractor {
    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly removeMuTagOutput: RemoveMuTagOutputPort;

    constructor(
        removeMuTagBatteryThreshold: Percent,
        muTagDevices: MuTagDevicesPort,
        accountRepoLocal: AccountRepositoryLocalPort,
        accountRepoRemote: AccountRepositoryRemotePort,
        muTagRepoLocal: MuTagRepositoryLocalPort,
        muTagRepoRemote: MuTagRepositoryRemotePort,
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
            muTag = await this.muTagRepoLocal.getByUid(uid);
            await this.muTagDevices.connectToProvisionedMuTag(
                account.accountNumber,
                muTag.beaconId
            );
        } catch (e) {
            console.warn(e);
            this.removeMuTagOutput.hideBusyIndicator();
            this.removeMuTagOutput.showError(new FailedToConnectToMuTag(e));
            return;
        }
        try {
            const batteryLevel = await this.muTagDevices.readBatteryLevel(
                account.accountNumber,
                muTag.beaconId
            );
            if (batteryLevel < this.removeMuTagBatteryThreshold) {
                const lowBatteryError = new LowMuTagBattery(
                    this.removeMuTagBatteryThreshold.valueOf()
                );
                this.removeMuTagOutput.hideBusyIndicator();
                this.removeMuTagOutput.showError(lowBatteryError);
                return;
            }
            await this.muTagDevices.unprovisionMuTag(
                account.accountNumber,
                muTag.beaconId
            );
        } catch (e) {
            this.removeMuTagOutput.hideBusyIndicator();
            this.removeMuTagOutput.showError(new MuTagCommunicationFailure(e));
            return;
        }
        try {
            account.removeMuTag(uid, muTag.beaconId);
            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUid(uid);
        } catch (e) {
            this.removeMuTagOutput.hideBusyIndicator();
            this.removeMuTagOutput.showError(
                new FailedToRemoveMuTagFromAccount(e)
            );
            return;
        }
        try {
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
        } catch (e) {
            console.warn(e);
        } finally {
            this.removeMuTagOutput.hideBusyIndicator();
        }
    }
}
