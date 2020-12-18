import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import { switchMap, take, filter } from "rxjs/operators";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import Logger from "../../shared/metaLanguage/Logger";
import MuTagDevicesPort, {
    Connection
} from "../../shared/muTagDevices/MuTagDevicesPort";
import { Millisecond } from "../../shared/metaLanguage/Types";

export const FailedToRemoveMuTagFromAccount: UserErrorType = {
    name: "FailedToRemoveMuTagFromAccount",
    userFriendlyMessage:
        "The Mu tag device successfully reset and disconnected from your account, but there was a problem removing the Mu tag from the app. Please notify support@informu.io."
};

export const LowMuTagBattery = (
    lowBatteryThreshold: number
): UserErrorType => ({
    name: "LowMuTagBattery",
    userFriendlyMessage: `Unable to remove Mu tag because its battery is below ${lowBatteryThreshold}%. Please charge Mu tag and try again.`
});

export default interface RemoveMuTagInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<UserError>;
    remove: (uid: string) => Promise<void>;
}

export class RemoveMuTagInteractorImpl implements RemoveMuTagInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<UserError>;

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
        this.showActivityIndicatorSubject = new BehaviorSubject<boolean>(false);
        this.showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
        this.showErrorSubject = new Subject<UserError>();
        this.showError = this.showErrorSubject.asObservable();
    }

    async remove(uid: string): Promise<void> {
        this.showActivityIndicatorSubject.next(true);
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
                    This.timeout
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
                            throw UserError.create(
                                LowMuTagBattery(
                                    this.removeMuTagBatteryThreshold.valueOf()
                                )
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
            this.showActivityIndicatorSubject.next(false);
            this.showErrorSubject.next(e);
        }
    }

    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;
    private readonly logger = Logger.instance;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly showActivityIndicatorSubject: BehaviorSubject<boolean>;
    private readonly showErrorSubject: Subject<UserError>;

    private async removeMuTagFromPersistence(
        account: Account,
        muTag: ProvisionedMuTag
    ): Promise<void> {
        try {
            account.removeMuTag(muTag.uid, muTag.beaconId);
            await this.accountRepoLocal.update(account);
            await this.muTagRepoLocal.removeByUid(muTag.uid);
        } catch (e) {
            this.showActivityIndicatorSubject.next(false);
            this.showErrorSubject.next(
                UserError.create(FailedToRemoveMuTagFromAccount, e)
            );
            return;
        }
        try {
            await this.accountRepoRemote.update(account);
            await this.muTagRepoRemote.removeByUid(muTag.uid, account.uid);
        } catch (e) {
            this.logger.warn(e, true);
        } finally {
            this.showActivityIndicatorSubject.next(false);
        }
    }

    private static readonly timeout = 5000 as Millisecond;
}

const This = RemoveMuTagInteractorImpl;
