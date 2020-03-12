import Percent from "../../shared/metaLanguage/Percent";
import { RemoveMuTagOutputPort } from "./RemoveMuTagOutputPort";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import MuTagDevicesPort from "./MuTagDevicesPort";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import { switchMap, take } from "rxjs/operators";

export const LowMuTagBattery = (
    lowBatteryThreshold: number
): UserErrorType => ({
    name: "LowMuTagBattery",
    userFriendlyMessage: `Unable to remove Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`
});

export const FailedToConnectToMuTag: UserErrorType = {
    name: "FailedToConnectToMuTag",
    userFriendlyMessage:
        "Could not connect to Mu tag. Please ensure that Mu tag is charged and move it closer to the app."
};

export const MuTagCommunicationFailure: UserErrorType = {
    name: "MuTagCommunicationFailure",
    userFriendlyMessage:
        "There was a problem communicating with the Mu tag. Please move Mu tag closer to the app."
};

export const FailedToRemoveMuTagFromAccount: UserErrorType = {
    name: "FailedToRemoveMuTagFromAccount",
    userFriendlyMessage:
        "The Mu tag device successfully reset and disconnected from your account, but there was a problem removing the Mu tag from the app. Please notify support@informu.io."
};

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
            await this.muTagDevices
                .connectToProvisionedMuTag(
                    account.accountNumber,
                    muTag.beaconId
                )
                .pipe(
                    switchMap(() =>
                        this.muTagDevices.readBatteryLevel(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            account!.accountNumber,
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            muTag!.beaconId
                        )
                    ),
                    switchMap(batteryLevel => {
                        if (batteryLevel < this.removeMuTagBatteryThreshold) {
                            throw UserError.create(
                                LowMuTagBattery(
                                    this.removeMuTagBatteryThreshold.valueOf()
                                )
                            );
                        } else {
                            return this.muTagDevices.unprovisionMuTag(
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                account!.accountNumber,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                muTag!.beaconId
                            );
                        }
                    }),
                    // The connection will error out after being unprovisioned
                    // so we should go ahead and complete observable.
                    take(1)
                )
                .toPromise();
        } catch (e) {
            console.warn(e);
            let error: UserError;
            if (e.name === "LowMuTagBattery") {
                error = e;
            } else {
                error = UserError.create(FailedToConnectToMuTag, e);
            }
            this.removeMuTagOutput.hideBusyIndicator();
            this.removeMuTagOutput.showError(error);
            return;
        }
        await this.removeMuTagFromPersistence(account, muTag);
    }

    private async removeMuTagFromPersistence(
        account: Account,
        muTag: ProvisionedMuTag
    ): Promise<void> {
        try {
            account.removeMuTag(muTag.uid, muTag.beaconId);
            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUid(muTag.uid);
        } catch (e) {
            this.removeMuTagOutput.hideBusyIndicator();
            this.removeMuTagOutput.showError(
                UserError.create(FailedToRemoveMuTagFromAccount, e)
            );
            return;
        }
        try {
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUid(muTag.uid, account.uid);
        } catch (e) {
            console.warn(e);
        } finally {
            this.removeMuTagOutput.hideBusyIndicator();
        }
    }
}
