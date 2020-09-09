import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Account from "../../../source/Core/Domain/Account";
import MuTagDevicesPort from "./MuTagDevicesPort";
import UserError, { UserErrorType } from "../../shared/metaLanguage/UserError";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import { switchMap, take } from "rxjs/operators";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import Logger from "../../shared/metaLanguage/Logger";

interface LowMuTagBattery extends UserErrorType {
    name: "lowMuTagBattery";
    lowBatteryThreshold: string;
}

interface FailedToConnectToMuTag extends UserErrorType {
    name: "failedToConnectToMuTag";
}

interface MuTagCommunicationFailure extends UserErrorType {
    name: "muTagCommunicationFailure";
}

interface FailedToRemoveMuTagFromAccount extends UserErrorType {
    name: "failedToRemoveMuTagFromAccount";
}

export type RemoveMuTagError =
    | LowMuTagBattery
    | FailedToConnectToMuTag
    | MuTagCommunicationFailure
    | FailedToRemoveMuTagFromAccount;

export default interface RemoveMuTagInteractor {
    readonly showActivityIndicator: Observable<boolean>;
    readonly showError: Observable<UserError<RemoveMuTagError>>;
    remove: (uid: string) => Promise<void>;
}

export class RemoveMuTagInteractorImpl implements RemoveMuTagInteractor {
    private static createError(
        type: RemoveMuTagError,
        originatingError?: unknown
    ): UserError<RemoveMuTagError> {
        return UserError.create(type, originatingError);
    }

    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly accountRepoRemote: AccountRepositoryRemotePort;
    private readonly logger = Logger.instance;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private readonly muTagRepoRemote: MuTagRepositoryRemotePort;
    private readonly removeMuTagBatteryThreshold: Percent;
    private readonly showActivityIndicatorSubject = new BehaviorSubject(false);
    readonly showActivityIndicator = this.showActivityIndicatorSubject.asObservable();
    private readonly showErrorSubject = new Subject<
        UserError<RemoveMuTagError>
    >();
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
                            const lowBatteryThreshold = this.removeMuTagBatteryThreshold
                                .valueOf()
                                .toString();
                            throw RemoveMuTagInteractorImpl.createError({
                                name: "lowMuTagBattery",
                                lowBatteryThreshold: lowBatteryThreshold
                            });
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
            let error: UserError<RemoveMuTagError>;
            if (e.name === "lowMuTagBattery") {
                error = e;
            } else {
                error = RemoveMuTagInteractorImpl.createError(
                    {
                        name: "failedToConnectToMuTag"
                    },
                    e
                );
            }
            this.showActivityIndicatorSubject.next(false);
            this.showErrorSubject.next(error);
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
                RemoveMuTagInteractorImpl.createError(
                    {
                        name: "failedToRemoveMuTagFromAccount"
                    },
                    e
                )
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
