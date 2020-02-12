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
            this.addMuTagOutput.showError(new NewMuTagNotFound(e));
            return;
        }
        if (
            this.unprovisionedMuTag.batteryLevel.valueOf() <
            this.addMuTagBatteryThreshold.valueOf()
        ) {
            const error = new LowMuTagBattery(
                this.addMuTagBatteryThreshold.valueOf()
            );
            this.addMuTagOutput.showError(error);
            return;
        }

        if (this.muTagName != null) {
            await this.addNewMuTag(
                this.unprovisionedMuTag,
                this.muTagName
            ).catch(e =>
                this.addMuTagOutput.showError(new FailedToAddMuTag(e))
            );
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
                this.addMuTagOutput.showError(new FailedToAddMuTag(e))
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
            const accountUid = await this.getAccountUid();
            await this.muTagRepoRemote.update(
                this.provisionedMuTag,
                accountUid
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
            const subscription = this.muTagDevices.unprovisionedMuTag.subscribe(
                unprovisionedMuTag => {
                    if (!didPromiseComplete) {
                        didPromiseComplete = true;
                        resolve(unprovisionedMuTag);
                    }
                    this.muTagDevices.stopFindingUnprovisionedMuTags();
                    subscription.unsubscribe();
                }
            );
            this.muTagDevices
                .startFindingUnprovisionedMuTags(this.connectThreshold, timeout)
                .then(() => {
                    if (!didPromiseComplete) {
                        didPromiseComplete = true;
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
        await this.muTagDevices.provisionMuTag(
            unprovisionedMuTag.id,
            accountNumber,
            beaconId
        );
        const uid = this.muTagRepoRemote.createNewUid(account.uid);
        this.provisionedMuTag = new ProvisionedMuTag({
            _uid: uid,
            _beaconID: beaconId,
            _muTagNumber: account.newMuTagNumber,
            _name: name,
            _batteryLevel: unprovisionedMuTag.batteryLevel,
            _isSafe: false,
            _lastSeen: new Date(),
            _color: MuTagColor.MuOrange
        });
        await this.muTagRepoLocal.add(this.provisionedMuTag);
        await this.muTagRepoRemote.add(this.provisionedMuTag, account.uid);

        account.addNewMuTag(this.provisionedMuTag.uid, beaconId);
        await this.accountRepoLocal.update(account);
        await this.accountRepoRemote.update(account);

        await this.muTagDevices.connectToProvisionedMuTag(
            accountNumber,
            beaconId
        );
        await this.muTagDevices.changeTxPower(
            TxPowerSetting["+6 dBm"],
            accountNumber,
            beaconId
        );
        this.muTagDevices.disconnectFromProvisionedMuTag(
            accountNumber,
            beaconId
        );

        this.addMuTagOutput.showMuTagFinalSetupScreen();
    }

    private resetAddNewMuTagState(): void {
        this.unprovisionedMuTag = undefined;
        this.provisionedMuTag = undefined;
        this.muTagName = undefined;
        this.accountUid = undefined;
    }

    private async getAccountUid(): Promise<string> {
        if (this.accountUid == null) {
            const account = await this.accountRepoLocal.get();
            this.accountUid = account.uid;
        }

        return this.accountUid;
    }
}
