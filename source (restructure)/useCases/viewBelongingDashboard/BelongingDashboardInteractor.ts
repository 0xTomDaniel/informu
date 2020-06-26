import { MuTagRepositoryLocal } from "../../../source/Core/Ports/MuTagRepositoryLocal";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import ProvisionedMuTag, {
    Address
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { skip } from "rxjs/operators";
import ObjectCollectionUpdate from "../../shared/metaLanguage/ObjectCollectionUpdate";
import { Observable, Subject } from "rxjs";
import Percent from "../../shared/metaLanguage/Percent";
import UserError from "../../shared/metaLanguage/UserError";

export interface DashboardBelonging {
    readonly address?: string;
    readonly batteryLevel: Percent;
    readonly isSafe: boolean;
    readonly lastSeen: Date;
    readonly name: string;
    readonly uid: string;
}

export type DashboardBelongingDelta = Partial<DashboardBelonging> & {
    readonly uid: string;
};

export default interface BelongingDashboardInteractor {
    readonly showError: Observable<UserError>;
    readonly showOnDashboard: Observable<
        ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
    >;
}

export class BelongingDashboardInteractorImpl
    implements BelongingDashboardInteractor {
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly showErrorSubject = new Subject<UserError>();
    readonly showError = this.showErrorSubject.asObservable();
    private readonly showOnDashboardSubject = new Subject<
        ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
    >();
    readonly showOnDashboard = this.showOnDashboardSubject.asObservable();

    constructor(
        muTagRepoLocal: MuTagRepositoryLocal,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.muTagRepoLocal = muTagRepoLocal;
        this.accountRepoLocal = accountRepoLocal;
    }

    async open(): Promise<void> {
        await this.subscribeToAccountMuTagChanges();
        const muTags = await this.muTagRepoLocal.getAll();
        if (muTags.size === 0) {
            this.belongingDashboardOutput.showNone();
            return;
        }
        const belongings: DashboardBelonging[] = [];
        muTags.forEach((muTag): void => {
            belongings.push({
                batteryLevel: muTag,
                uid: muTag.uid,
                name: muTag.name,
                isSafe: muTag.isSafe,
                lastSeen: muTag.lastSeen
            });
        });
        //this.belongingDashboardOutput.showAll(belongings);
        this.showOnDashboardSubject.next(new ObjectCollectionUpdate());
        muTags.forEach((muTag): void => {
            this.updateDashboardOnSafetyStatusChange(muTag);
            this.updateDashboardOnAddressChange(muTag);
        });
    }

    private async subscribeToAccountMuTagChanges(): Promise<void> {
        const account = await this.accountRepoLocal.get();
        account.muTagsChange.subscribe((change): void => {
            if (change.insertion != null) {
                this.muTagRepoLocal
                    .getByUid(change.insertion)
                    .then(muTag => {
                        const dashboardBelonging = {
                            uid: muTag.uid,
                            name: muTag.name,
                            isSafe: muTag.isSafe,
                            lastSeen: muTag.lastSeen
                        };
                        //this.belongingDashboardOutput.add(dashboardBelonging);
                        this.showOnDashboardSubject.next(
                            new ObjectCollectionUpdate()
                        );
                        this.updateDashboardOnSafetyStatusChange(muTag);
                        this.updateDashboardOnAddressChange(muTag);
                    })
                    .catch((e): void => {
                        console.warn(`muTagRepoLocal.getByUid() - error: ${e}`);
                    });
            }

            if (change.deletion != null) {
                //this.belongingDashboardOutput.remove(change.deletion);
                this.showOnDashboardSubject.next(new ObjectCollectionUpdate());
            }
        });
    }

    private updateDashboardOnSafetyStatusChange(muTag: ProvisionedMuTag): void {
        muTag.safetyStatus.pipe(skip(1)).subscribe((update): void => {
            /*this.belongingDashboardOutput.update({
                uid: muTag.uid,
                isSafe: update.isSafe,
                lastSeen: update.lastSeen
            });*/
            this.showOnDashboardSubject.next(new ObjectCollectionUpdate());
        });
    }

    private updateDashboardOnAddressChange(muTag: ProvisionedMuTag): void {
        muTag.address.subscribe(addressUpdate => {
            /*this.belongingDashboardOutput.update({
                uid: muTag.uid,
                address: this.addressOutput(addressUpdate)
            });*/
            this.showOnDashboardSubject.next(new ObjectCollectionUpdate());
        });
    }

    private addressOutput(address: Address | undefined): string | undefined {
        return address == null
            ? undefined
            : `${address.route}, ${address.locality}, ${address.administrativeAreaLevel1}`;
    }
}
