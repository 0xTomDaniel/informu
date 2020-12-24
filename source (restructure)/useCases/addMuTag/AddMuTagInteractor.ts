import MuTagDevicesPort, {
    TxPowerSetting,
    UnprovisionedMuTag,
    AdvertisingIntervalSetting,
    Connection
} from "../../shared/muTagDevices/MuTagDevicesPort";
import { Rssi, Millisecond } from "../../shared/metaLanguage/Types";
import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { switchMap, catchError, first } from "rxjs/operators";
import { EmptyError } from "rxjs";
import Exception from "../../shared/metaLanguage/Exception";

const ExceptionType = [
    "FailedToAddMuTag",
    "FailedToNameMuTag",
    "FailedToSaveSettings",
    "FindNewMuTagCanceled",
    "LowMuTagBattery",
    "NewMuTagNotFound"
] as const;
type ExceptionType = typeof ExceptionType[number];

export class AddMuTagInteractorException extends Exception<ExceptionType> {
    static isType<T extends ExceptionType>(
        value: unknown,
        type: T
    ): value is AddMuTagInteractorException & Exception<T> {
        if (value instanceof AddMuTagInteractorException) {
            return value.type === type;
        }
        return false;
    }

    static FailedToAddMuTag(
        originatingError: unknown
    ): AddMuTagInteractorException {
        return new this(
            "FailedToAddMuTag",
            "Failed to add Mu tag.",
            "error",
            originatingError,
            true,
            true
        );
    }

    static FailedToNameMuTag(
        originatingError: unknown
    ): AddMuTagInteractorException {
        return new this(
            "FailedToNameMuTag",
            "Failed to name Mu tag.",
            "error",
            originatingError,
            true,
            true
        );
    }

    static FailedToSaveSettings(
        originatingError: unknown
    ): AddMuTagInteractorException {
        return new this(
            "FailedToSaveSettings",
            "Failed to save Mu tag settings.",
            "error",
            originatingError,
            true,
            true
        );
    }

    static get FindNewMuTagCanceled(): AddMuTagInteractorException {
        return new this(
            "FindNewMuTagCanceled",
            "Find new Mu tag has been canceled.",
            "log",
            undefined,
            true
        );
    }

    static LowMuTagBattery(
        lowBatteryThreshold: number
    ): AddMuTagInteractorException {
        return new this(
            "LowMuTagBattery",
            `Mu tag battery is too low. It's below ${lowBatteryThreshold}%.`,
            "warn",
            undefined,
            true
        );
    }

    static NewMuTagNotFound(
        originatingError: unknown
    ): AddMuTagInteractorException {
        return new this(
            "NewMuTagNotFound",
            "Could not find a new Mu tag.",
            "warn",
            originatingError,
            true
        );
    }
}

/*export const LowMuTagBattery = (
    lowBatteryThreshold: number
): UserErrorType => ({
    name: "LowMuTagBattery",
    userFriendlyMessage: `Unable to add Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`
});

export const NewMuTagNotFound: UserErrorType = {
    name: "NewMuTagNotFound",
    userFriendlyMessage:
        "Could not find a new Mu tag. Be sure the Mu tag light is flashing and keep it close to the app."
};

export const FailedToAddMuTag: UserErrorType = {
    name: "FailedToAddMuTag",
    userFriendlyMessage:
        "There was problem adding the Mu tag. Please keep Mu tag close to the app and try again."
};

export const FailedToNameMuTag: UserErrorType = {
    name: "FailedToNameMuTag",
    userFriendlyMessage:
        "There was problem naming the Mu tag. Please try again."
};

export const FailedToSaveSettings: UserWarningType = {
    name: "FailedToSaveSettings",
    userFriendlyMessage:
        "Your Mu tag added successfully but some settings failed to save."
};

export const FindNewMuTagCanceled: UserErrorType = {
    name: "FindNewMuTagCanceled",
    userFriendlyMessage: "Finding new Mu tag has been canceled."
};*/

export default interface AddMuTagInteractor {
    addFoundMuTag(): Promise<void>;
    findNewMuTag(): Promise<void>;
    setMuTagName(name: string): Promise<void>;
    stopFindingNewMuTag(): Promise<void>;
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
                catchError(e => {
                    this.muTagDevices.disconnectFromMuTag(connection);
                    throw AddMuTagInteractorException.isType(
                        e,
                        "LowMuTagBattery"
                    )
                        ? e
                        : AddMuTagInteractorException.FailedToAddMuTag(e);
                }),
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
            .pipe(
                first(),
                catchError(e => {
                    if (e instanceof EmptyError) {
                        throw AddMuTagInteractorException.FindNewMuTagCanceled;
                    } else {
                        throw AddMuTagInteractorException.NewMuTagNotFound(e);
                    }
                })
            )
            .toPromise();
        await this.muTagDevices.stopFindingUnprovisionedMuTags();
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
        try {
            this.provisionedMuTag.setName(name);
            await this.muTagRepoRemote.update(
                this.provisionedMuTag,
                this.accountUid,
                this.accountNumber
            );
            await this.muTagRepoLocal.update(this.provisionedMuTag);
        } catch (e) {
            throw AddMuTagInteractorException.FailedToNameMuTag(e);
        }
    }

    async stopFindingNewMuTag(): Promise<void> {
        await this.muTagDevices.stopFindingUnprovisionedMuTags();
    }

    private readonly connectThreshold: Rssi;
    private readonly addMuTagBatteryThreshold: Percent;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;

    private unprovisionedMuTag: UnprovisionedMuTag | undefined;
    private provisionedMuTag: ProvisionedMuTag | undefined;
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
            _advertisingInterval: 3,
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
            throw AddMuTagInteractorException.LowMuTagBattery(
                this.addMuTagBatteryThreshold.valueOf()
            );
        }
        return batteryLevel;
    }

    private static findMuTagTimeout = 5000 as Millisecond;
}

const This = AddMuTagInteractorImpl;
