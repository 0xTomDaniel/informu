import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import { switchMap, take, filter } from "rxjs/operators";
import Logger from "../../shared/metaLanguage/Logger";
import MuTagDevicesPort, {
    Connection,
    MuTagDevicesException
} from "../../shared/muTagDevices/MuTagDevicesPort";
import { Millisecond } from "../../shared/metaLanguage/Types";
import Exception from "../../shared/metaLanguage/Exception";

const ExceptionType = [
    "FailedToFindMuTag",
    "FailedToRemoveMuTag",
    "FailedToRemoveMuTagFromAccount",
    "FailedToResetMuTag",
    "LowMuTagBattery"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class RemoveMuTagInteractorException<
    T extends ExceptionType
> extends Exception<T> {
    static FailedToFindMuTag(
        muTagUid: string,
        sourceException: unknown
    ): RemoveMuTagInteractorException<"FailedToFindMuTag"> {
        return new this(
            "FailedToFindMuTag",
            `Could not find Mu tag (${muTagUid}).`,
            "log",
            sourceException
        );
    }

    static FailedToRemoveMuTag(
        muTagUid: string,
        sourceException: unknown
    ): RemoveMuTagInteractorException<"FailedToRemoveMuTag"> {
        return new this(
            "FailedToRemoveMuTag",
            `Failed to remove MuTag (${muTagUid}).`,
            "error",
            sourceException,
            true
        );
    }

    static FailedToRemoveMuTagFromAccount(
        muTagUid: string,
        sourceException: unknown
    ): RemoveMuTagInteractorException<"FailedToRemoveMuTagFromAccount"> {
        return new this(
            "FailedToRemoveMuTagFromAccount",
            `The Mu tag device (${muTagUid}) successfully reset, but there was a problem removing it from the app.`,
            "error",
            sourceException,
            true
        );
    }

    static FailedToResetMuTag(
        muTagUid: string,
        sourceException: unknown
    ): RemoveMuTagInteractorException<"FailedToResetMuTag"> {
        return new this(
            "FailedToResetMuTag",
            `Failed to reset Mu tag (${muTagUid}).`,
            "error",
            sourceException,
            true
        );
    }

    static LowMuTagBattery(
        lowBatteryThreshold: number
    ): RemoveMuTagInteractorException<"LowMuTagBattery"> {
        return new this(
            "LowMuTagBattery",
            `Unable to remove Mu tag because its battery is below ${lowBatteryThreshold}%.`,
            "log"
        );
    }
}

export default interface RemoveMuTagInteractor {
    remove: (uid: string) => Promise<void>;
}

export class RemoveMuTagInteractorImpl implements RemoveMuTagInteractor {
    constructor(
        removeMuTagBatteryThreshold: Percent,
        muTagDevices: MuTagDevicesPort,
        accountRepoLocal: AccountRepositoryLocalPort,
        accountRepoRemote: AccountRepositoryRemotePort,
        muTagRepoLocal: MuTagRepositoryLocalPort,
        muTagRepoRemote: MuTagRepositoryRemotePort
    ) {
        this.removeMuTagBatteryThreshold = removeMuTagBatteryThreshold;
        this.muTagDevices = muTagDevices;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
    }

    async remove(uid: string): Promise<void> {
        let account: Account;
        let muTag: ProvisionedMuTag;
        try {
            account = await this.accountRepoLocal.get();
            muTag = await this.muTagRepoLocal.getByUid(uid);
            let connection: Connection;
            await this.muTagDevices
                .connectToProvisionedMuTag(
                    account.accountNumber,
                    muTag.beaconId,
                    This.muTagConnectTimeout
                )
                .pipe(
                    switchMap(cnnctn => {
                        connection = cnnctn;
                        return this.muTagDevices.readBatteryLevel(cnnctn);
                    }),
                    filter(batteryLevel => {
                        const doesPassThreshold =
                            batteryLevel >= this.removeMuTagBatteryThreshold;
                        if (!doesPassThreshold) {
                            this.muTagDevices
                                .disconnectFromMuTag(connection)
                                .catch(e => this.logger.warn(e, true));
                            throw RemoveMuTagInteractorException.LowMuTagBattery(
                                this.removeMuTagBatteryThreshold.valueOf()
                            );
                        }
                        return doesPassThreshold;
                    }),
                    switchMap(() =>
                        this.muTagDevices.unprovisionMuTag(connection)
                    ),
                    // The connection will error out 20s after being
                    // unprovisioned so we should go ahead and complete
                    // observable before it errors.
                    take(1)
                )
                .toPromise();
            await this.removeMuTagFromPersistence(account, muTag);
        } catch (e) {
            if (RemoveMuTagInteractorException.isType(e)) {
                throw e;
            } else if (MuTagDevicesException.isType(e)) {
                switch (e.type) {
                    case "FailedToFindMuTag":
                        throw RemoveMuTagInteractorException.FailedToFindMuTag(
                            uid,
                            e
                        );
                    default:
                        throw RemoveMuTagInteractorException.FailedToResetMuTag(
                            uid,
                            e
                        );
                }
            } else {
                throw RemoveMuTagInteractorException.FailedToRemoveMuTag(
                    uid,
                    e
                );
            }
        }
    }

    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;
    private readonly logger = Logger.instance;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly removeMuTagBatteryThreshold: Percent;

    private async removeMuTagFromPersistence(
        account: Account,
        muTag: ProvisionedMuTag
    ): Promise<void> {
        try {
            account.removeMuTag(muTag.uid, muTag.beaconId);
            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUid(muTag.uid);
        } catch (e) {
            throw RemoveMuTagInteractorException.FailedToRemoveMuTagFromAccount(
                muTag.uid,
                e
            );
        }
        try {
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUid(muTag.uid, account.uid);
        } catch (e) {
            this.logger.warn(e, true, true);
        }
    }

    private static readonly muTagConnectTimeout = 5000 as Millisecond;
}

const This = RemoveMuTagInteractorImpl;
