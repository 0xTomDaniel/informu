import MuTagDevicesPort, {
    TxPowerSetting,
    UnprovisionedMuTag,
    AdvertisingIntervalSetting,
    Connection
} from "../../shared/muTagDevices/MuTagDevicesPort";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import UserWarning, {
    UserWarningType
} from "../../shared/metaLanguage/UserWarning";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { take, switchMap, tap, filter } from "rxjs/operators";
import { Subject, EMPTY } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";

const LowMuTagBattery = (lowBatteryThreshold: number): UserErrorType => ({
    name: "LowMuTagBattery",
    userFriendlyMessage: `Unable to add Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`
});

export const NewMuTagNotFound: UserErrorType = {
    name: "NewMuTagNotFound",
    userFriendlyMessage:
        "Could not find a new Mu tag. Be sure the Mu tag light is flashing and keep it close to the app."
};

const FailedToAddMuTag: UserErrorType = {
    name: "FailedToAddMuTag",
    userFriendlyMessage:
        "There was problem adding the Mu tag. Please keep Mu tag close to the app and try again."
};

export const FailedToSaveSettings: UserWarningType = {
    name: "FailedToSaveSettings",
    userFriendlyMessage:
        "Your Mu tag added successfully but some settings failed to save."
};

export default interface AddMuTagInteractor {
    addFoundMuTag(): Promise<void>;
    findNewMuTag(): Promise<void>;
    setMuTagName(name: string): Promise<void>;
    stopFindingNewMuTag(): void;
}

export class AddMuTagInteractorImpl implements AddMuTagInteractor {
    constructor(
        connectThreshold: Rssi,
        addMuTagBatteryThreshold: Percent,
        muTagDevices: MuTagDevicesPort,
        muTagRepoLocal: MuTagRepositoryLocalPort,
        muTagRepoRemote: MuTagRepositoryRemotePort,
        accountRepoLocal: AccountRepositoryLocalPort,
        accountRepoRemote: AccountRepositoryRemotePort
    ) {
        this.connectThreshold = connectThreshold;
        this.addMuTagBatteryThreshold = addMuTagBatteryThreshold;
        this.muTagDevices = muTagDevices;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
    }

    async addFoundMuTag(): Promise<void> {
        if (this.unprovisionedMuTag == null) {
            throw Error("No Mu tag has been found to add.");
        }
        let connection: Connection;
        await this.muTagDevices
            .connectToUnprovisionedMuTag(this.unprovisionedMuTag)
            .pipe(
                switchMap(async cnnctn => {
                    connection = cnnctn;
                    return this.verifyBatteryLevel(cnnctn);
                }),
                switchMap(batteryLevel =>
                    this.addMuTagToPersistence(
                        batteryLevel,
                        this.unprovisionedMuTag?.macAddress
                    )
                ),
                switchMap(() =>
                    this.muTagDevices.provisionMuTag(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this.accountNumber!,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this.provisionedMuTag!.beaconId,
                        connection
                    )
                ),
                switchMap(() =>
                    this.muTagDevices.changeTxPower(
                        TxPowerSetting["+6 dBm"],
                        connection
                    )
                ),
                switchMap(() =>
                    this.muTagDevices.changeAdvertisingInterval(
                        AdvertisingIntervalSetting["852 ms"],
                        connection
                    )
                ),
                switchMap(() =>
                    this.muTagDevices.disconnectFromMuTag(connection)
                )
            )
            .toPromise();
    }

    async findNewMuTag(): Promise<void> {
        this.unprovisionedMuTag = await this.muTagDevices
            .startFindingUnprovisionedMuTags(
                this.connectThreshold,
                This.findMuTagTimeout
            )
            .pipe(take(1))
            .toPromise();
        await this.muTagDevices.stopFindingUnprovisionedMuTags();

        /*const findTimeout = 120000 as Millisecond;
        try {
            this.unprovisionedMuTag = await this.findFirstUnprovisionedMuTag(
                findTimeout
            );
        } catch (e) {
            this.showError(UserError.create(NewMuTagNotFound, e));
            return;
        }
        if (
            this.unprovisionedMuTag.batteryLevel.valueOf() <
            this.addMuTagBatteryThreshold.valueOf()
        ) {
            const error = UserError.create(
                LowMuTagBattery(this.addMuTagBatteryThreshold.valueOf())
            );
            this.showError(error);
            return;
        }

        if (this.muTagName != null) {
            await this.addNewMuTag(
                this.unprovisionedMuTag,
                this.muTagName
            ).catch(e => this.showError(UserError.create(FailedToAddMuTag, e)));
        }*/
    }

    async setMuTagName(name: string): Promise<void> {
        if (this.provisionedMuTag == null) {
            throw Error("Provisioned Mu tag does not exist.");
        }
        if (this.accountUid == null) {
            throw Error("Account UID not found.");
        }
        if (this.accountNumber == null) {
            throw Error("Account number not found.");
        }
        this.provisionedMuTag.setName(name);
        await this.muTagRepoLocal.update(this.provisionedMuTag);
        await this.muTagRepoRemote.update(
            this.provisionedMuTag,
            this.accountUid,
            this.accountNumber
        );
        /*this.addMuTagOutput.showActivityIndicator();

        if (this.unprovisionedMuTag != null) {
            await this.addNewMuTag(this.unprovisionedMuTag, name).catch(e =>
                this.showError(UserError.create(FailedToAddMuTag, e))
            );
        } else {
            this.muTagName = name;
            this.addMuTagOutput.showMuTagConnectingScreen();
        }*/
    }

    stopFindingNewMuTag(): void {
        /*this.addMuTagOutput.showHomeScreen();
        this.muTagDevices.stopFindingUnprovisionedMuTags();
        this.resetAddNewMuTagState();*/
    }

    /*async completeMuTagSetup(color: MuTagColor): Promise<void> {
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
            this.addMuTagOutput.showWarning(
                UserWarning.create(FailedToSaveSettings, e)
            );
        } finally {
            this.resetAddNewMuTagState();
            this.addMuTagOutput.showHomeScreen();
        }
    }*/

    private readonly connectThreshold: Rssi;
    private readonly addMuTagBatteryThreshold: Percent;
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

    private async addMuTagToPersistence(
        batteryLevel: Percent,
        macAddress?: string
    ): Promise<void> {
        const account = await this.accountRepoLocal.get();
        this.accountUid = account.uid;
        const beaconId = account.newBeaconId;
        const uid = this.muTagRepoRemote.createNewUid(account.uid);
        const dateNow = new Date();
        this.provisionedMuTag = new ProvisionedMuTag({
            _advertisingInterval: 1,
            _batteryLevel: batteryLevel,
            _beaconId: beaconId,
            _color: MuTagColor.MuOrange,
            _dateAdded: dateNow,
            _didExitRegion: true,
            _firmwareVersion: "1.6.1",
            _isSafe: false,
            _lastSeen: dateNow,
            _macAddress: macAddress ?? "unknown",
            _modelNumber: "REV8",
            _muTagNumber: account.newMuTagNumber,
            _name: "unnamed",
            _recentLatitude: 0,
            _recentLongitude: 0,
            _txPower: 1,
            _uid: uid
        });

        const undoCommands: (() => Promise<void>)[] = [];

        this.accountNumber = account.accountNumber;
        await this.muTagRepoRemote.add(
            this.provisionedMuTag,
            account.uid,
            this.accountNumber
        );
        undoCommands.push(() =>
            this.muTagRepoRemote.removeByUid(uid, account.uid)
        );

        const executeUndoCommands = async () => {
            const execute = undoCommands.map(command => command());
            await Promise.all(execute);
        };
        const onError = async (error: any) => {
            await executeUndoCommands();
            throw error;
        };

        // Mu tag must be added to local persistence before being added to
        // account. It's probably best to refactor so that Mu tags don't need to
        // be added to the account object. That's probably better domain driven
        // design.
        await this.muTagRepoLocal.add(this.provisionedMuTag).catch(onError);
        undoCommands.push(() => this.muTagRepoLocal.removeByUid(uid));

        try {
            account.addNewMuTag(this.provisionedMuTag.uid, beaconId);
            undoCommands.push(async () => account.removeMuTag(uid, beaconId));
        } catch (e) {
            await onError(e);
        }

        await this.accountRepoRemote.update(account).catch(onError);
        undoCommands.push(() => this.accountRepoRemote.update(account));

        await this.accountRepoLocal.update(account).catch(onError);
    }

    private async verifyBatteryLevel(connection: Connection): Promise<Percent> {
        const batteryLevel = await this.muTagDevices.readBatteryLevel(
            connection
        );
        if (batteryLevel.valueOf() < this.addMuTagBatteryThreshold.valueOf()) {
            throw UserError.create(
                LowMuTagBattery(this.addMuTagBatteryThreshold.valueOf())
            );
        }
        return batteryLevel;
    }

    /*private async findFirstUnprovisionedMuTag(
        timeout: Millisecond
    ): Promise<UnprovisionedMuTag> {
        const unprovisionedMuTag = await this.muTagDevices
            .startFindingUnprovisionedMuTags(this.connectThreshold, timeout)
            .pipe(take(1))
            .toPromise();
        this.muTagDevices.stopFindingUnprovisionedMuTags();
        return unprovisionedMuTag;
    }*/

    /*private async addNewMuTag(
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
                            .then(() =>
                                this.muTagDevices.changeAdvertisingInterval(
                                    AdvertisingIntervalSetting["852 ms"],
                                    accountNumber,
                                    beaconId
                                )
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
    }*/

    /*private showError(error: UserError): void {
        this.resetAddNewMuTagState();
        this.addMuTagOutput.showError(error);
    }*/

    /*private resetAddNewMuTagState(): void {
        this.unprovisionedMuTag = undefined;
        this.provisionedMuTag = undefined;
        this.muTagName = undefined;
    }*/

    /*private async getAccountIds(): Promise<{
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
    }*/

    private static findMuTagTimeout = 30000 as Millisecond;
}

const This = AddMuTagInteractorImpl;
