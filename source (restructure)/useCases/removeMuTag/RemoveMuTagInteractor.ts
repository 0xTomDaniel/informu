import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import { switchMap, take } from "rxjs/operators";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import Logger from "../../shared/metaLanguage/Logger";
import MuTagDevicesPort, {
    Connection
} from "../../shared/muTagDevices/MuTagDevicesPort";

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
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;
    private readonly logger = Logger.instance;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly showActivityIndicatorSubject = new BehaviorSubject(false);
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    private readonly showErrorSubject = new Subject<UserError>();
    readonly showError = this.showErrorSubject.asObservable();

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
        this.showActivityIndicatorSubject.next(true);
        let account: Account | undefined;
        let muTag: ProvisionedMuTag | undefined;
        try {
            account = await this.accountRepoLocal.get();
            muTag = await this.muTagRepoLocal.getByUid(uid);
            let connection: Connection;
            await this.muTagDevices
                .connectToProvisionedMuTag(
                    account.accountNumber,
                    muTag.beaconId
                )
                .pipe(
                    switchMap(cnnctn => {
                        connection = cnnctn;
                        return this.muTagDevices.readBatteryLevel(cnnctn);
                    }),
                    switchMap(batteryLevel => {
                        if (batteryLevel < this.removeMuTagBatteryThreshold) {
                            throw UserError.create(
                                LowMuTagBattery(
                                    this.removeMuTagBatteryThreshold.valueOf()
                                )
                            );
                        } else {
                            return this.muTagDevices.unprovisionMuTag(
                                connection
                            );
                        }
                    }),
                    // The connection will error out after being unprovisioned
                    // so we should go ahead and complete observable.
                    take(1)
                )
                .toPromise();
        } catch (e) {
            this.showActivityIndicatorSubject.next(false);
            this.showErrorSubject.next(e);
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
}
