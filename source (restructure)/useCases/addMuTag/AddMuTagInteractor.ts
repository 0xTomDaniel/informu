import AddMuTagOutputPort from "./AddMuTagOutputPort";
import MuTagDevicesPort, {
    TxPowerSetting,
    UnprovisionedMuTag
} from "./MuTagDevicesPort";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import UserError from "../../shared/metaLanguage/UserError";
import UserWarning from "../../shared/metaLanguage/UserWarning";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { take, switchMap } from "rxjs/operators";

class LowMuTagBattery extends UserError {
    name = "LowMuTagBattery";
    userErrorDescription: string;
    constructor(lowBatteryThreshold: number, originatingError?: Error) {
        super(originatingError);
        this.userErrorDescription = `Unable to add Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`;
    }
}

class NewMuTagNotFound extends UserError {
    name = "NewMuTagNotFound";
    userErrorDescription =
        "Could not find a new Mu tag. Be sure the Mu tag light is flashing and keep it close to the app.";
}

class FailedToAddMuTag extends UserError {
    name = "FailedToAddMuTag";
    userErrorDescription =
        "There was problem adding the Mu tag. Please keep Mu tag close to the app and try again.";
}

class FailedToSaveSettings extends UserWarning {
    name = "FailedToSaveSettings";
    userWarningDescription =
        "Your Mu tag added successfully but some settings failed to save.";
}

export default class AddMuTagInteractor {
    private readonly connectThreshold: Rssi;
    private readonly addMuTagBatteryThreshold: Percent;
    private readonly addMuTagOutput: AddMuTagOutputPort;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;

    private unprovisionedMuTag: UnprovisionedMuTag | undefined;
    private provisionedMuTag: ProvisionedMuTag | undefined;
    private muTagName: string | undefined;
    private accountUid: string | undefined;
    private accountNumber: AccountNumber | undefined;

    constructor(
        connectThreshold: Rssi,
        addMuTagBatteryThreshold: Percent,
        addMuTagOutput: AddMuTagOutputPort,
        muTagDevices: MuTagDevicesPort,
        muTagRepoLocal: MuTagRepositoryLocalPort,
        muTagRepoRemote: MuTagRepositoryRemotePort,
        accountRepoLocal: AccountRepositoryLocalPort,
        accountRepoRemote: AccountRepositoryRemotePort
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
        const findTimeout = 120000 as Millisecond;
        try {
            this.unprovisionedMuTag = await this.findFirstUnprovisionedMuTag(
                findTimeout
            );
        } catch (e) {
            this.showError(new NewMuTagNotFound(e));
            return;
        }
        if (
            this.unprovisionedMuTag.batteryLevel.valueOf() <
            this.addMuTagBatteryThreshold.valueOf()
        ) {
            const error = new LowMuTagBattery(
                this.addMuTagBatteryThreshold.valueOf()
            );
            this.showError(error);
            return;
        }

        if (this.muTagName != null) {
            await this.addNewMuTag(
                this.unprovisionedMuTag,
                this.muTagName
            ).catch(e => this.showError(new FailedToAddMuTag(e)));
        }
    }

    stopAddingNewMuTag(): void {
        this.addMuTagOutput.showHomeScreen();
        this.muTagDevices.stopFindingUnprovisionedMuTags();
        this.resetAddNewMuTagState();
    }

    instructionsComplete(): void {
        this.addMuTagOutput.showMuTagNamingScreen();
    }

    async setMuTagName(name: string): Promise<void> {
        this.addMuTagOutput.showActivityIndicator();

        if (this.unprovisionedMuTag != null) {
            await this.addNewMuTag(this.unprovisionedMuTag, name).catch(e =>
                this.showError(new FailedToAddMuTag(e))
            );
        } else {
            this.muTagName = name;
            this.addMuTagOutput.showMuTagConnectingScreen();
        }
    }

    async completeMuTagSetup(color: MuTagColor): Promise<void> {
        try {
            if (this.provisionedMuTag == null) {
                throw Error("Newly provisioned Mu tag not found.");
            }

            this.addMuTagOutput.showActivityIndicator();

            this.provisionedMuTag.changeColor(color);
            await this.muTagRepoLocal.update(this.provisionedMuTag);
            const { accountUid, accountNumber } = await this.getAccountIds();
            await this.muTagRepoRemote.update(
                this.provisionedMuTag,
                accountUid,
                accountNumber
            );
        } catch (e) {
            this.addMuTagOutput.showWarning(new FailedToSaveSettings(e));
        } finally {
            this.resetAddNewMuTagState();
            this.addMuTagOutput.showHomeScreen();
        }
    }

    private async findFirstUnprovisionedMuTag(
        timeout: Millisecond
    ): Promise<UnprovisionedMuTag> {
        let didPromiseComplete = false;
        return new Promise((resolve, reject) => {
            const subscription = this.muTagDevices.unprovisionedMuTag
                .pipe(take(1))
                .subscribe(unprovisionedMuTag => {
                    if (!didPromiseComplete) {
                        didPromiseComplete = true;
                        this.muTagDevices.stopFindingUnprovisionedMuTags();
                        resolve(unprovisionedMuTag);
                    }
                });
            this.muTagDevices
                .startFindingUnprovisionedMuTags(this.connectThreshold, timeout)
                .then(() => {
                    if (!didPromiseComplete) {
                        didPromiseComplete = true;
                        subscription.unsubscribe();
                        reject(
                            new Error(
                                "Could not find any unprovisioned Mu tags."
                            )
                        );
                    }
                })
                .catch(e => reject(e));
        });
    }

    private async addNewMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        name: string
    ): Promise<void> {
        const account = await this.accountRepoLocal.get();
        const beaconId = account.newBeaconId;
        const accountNumber = account.accountNumber;
        const uid = this.muTagRepoRemote.createNewUid(account.uid);
        const dateNow = new Date();
        this.provisionedMuTag = new ProvisionedMuTag({
            _advertisingInterval: 1,
            _batteryLevel: unprovisionedMuTag.batteryLevel,
            _beaconId: beaconId,
            _color: MuTagColor.MuOrange,
            _dateAdded: dateNow,
            _didExitRegion: true,
            _firmwareVersion: "1.6.1",
            _isSafe: false,
            _lastSeen: dateNow,
            _macAddress: unprovisionedMuTag.macAddress,
            _modelNumber: "REV8",
            _muTagNumber: account.newMuTagNumber,
            _name: name,
            _recentLatitude: 0,
            _recentLongitude: 0,
            _txPower: 1,
            _uid: uid
        });

        await this.muTagRepoRemote.add(
            this.provisionedMuTag,
            account.uid,
            accountNumber
        );

        // Mu tag must be added to local persistence before being added to
        // account. It's probably best to refactor so that Mu tags don't need to
        // be added to the account object. That's probably better domain driven
        // design.
        try {
            await this.muTagRepoLocal.add(this.provisionedMuTag);
        } catch (e) {
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
            throw e;
        }
        try {
            account.addNewMuTag(this.provisionedMuTag.uid, beaconId);
        } catch (e) {
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
            await this.muTagRepoLocal.removeByUid(uid);
        }
        try {
            await this.accountRepoRemote.update(account);
        } catch (e) {
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
            await this.muTagRepoLocal.removeByUid(uid);
            account.removeMuTag(uid, beaconId);
            throw e;
        }
        try {
            await this.accountRepoLocal.update(account);
        } catch (e) {
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
            await this.muTagRepoLocal.removeByUid(uid);
            account.removeMuTag(uid, beaconId);
            await this.accountRepoRemote.update(account);
            throw e;
        }
        try {
            await this.muTagDevices.provisionMuTag(
                unprovisionedMuTag.id,
                accountNumber,
                beaconId
            );
        } catch (e) {
            await this.muTagRepoRemote.removeByUid(uid, account.uid);
            await this.muTagRepoLocal.removeByUid(uid);
            account.removeMuTag(uid, beaconId);
            await this.accountRepoRemote.update(account);
            await this.accountRepoLocal.update(account);
            throw e;
        }
        try {
            await this.muTagDevices
                .connectToProvisionedMuTag(accountNumber, beaconId)
                .pipe(
                    switchMap(() =>
                        this.muTagDevices
                            .changeTxPower(
                                TxPowerSetting["+6 dBm"],
                                accountNumber,
                                beaconId
                            )
                            .finally(() =>
                                this.muTagDevices.disconnectFromProvisionedMuTag(
                                    accountNumber,
                                    beaconId
                                )
                            )
                    )
                )
                .toPromise();
        } catch (e) {
            console.warn(e);
        }

        this.addMuTagOutput.showMuTagFinalSetupScreen();
    }

    private showError(error: UserError): void {
        this.resetAddNewMuTagState();
        this.addMuTagOutput.showError(error);
    }

    private resetAddNewMuTagState(): void {
        this.unprovisionedMuTag = undefined;
        this.provisionedMuTag = undefined;
        this.muTagName = undefined;
    }

    private async getAccountIds(): Promise<{
        accountUid: string;
        accountNumber: AccountNumber;
    }> {
        if (this.accountUid == null || this.accountNumber == null) {
            const account = await this.accountRepoLocal.get();
            this.accountUid = account.uid;
            this.accountNumber = account.accountNumber;
        }

        return {
            accountUid: this.accountUid,
            accountNumber: this.accountNumber
        };
    }
}