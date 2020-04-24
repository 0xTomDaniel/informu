import { MuTagRepositoryLocal } from "../../../source/Core/Ports/MuTagRepositoryLocal";
import {
    BelongingDashboardOutputPort,
    DashboardBelonging
} from "./BelongingDashboardOutputPort";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import ProvisionedMuTag, {
    Address
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { skip } from "rxjs/operators";

export default class BelongingDashboardInteractor {
    private readonly belongingDashboardOutput: BelongingDashboardOutputPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        belongingDashboardOutput: BelongingDashboardOutputPort,
        muTagRepoLocal: MuTagRepositoryLocal,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.belongingDashboardOutput = belongingDashboardOutput;
        this.muTagRepoLocal = muTagRepoLocal;
        this.accountRepoLocal = accountRepoLocal;
    }

    async open(): Promise<void> {
        const muTags = await this.muTagRepoLocal.getAll();

        await this.subscribeToMuTagChanges(muTags);

        if (muTags.size === 0) {
            this.belongingDashboardOutput.showNone();
            return;
        }

        const belongings: DashboardBelonging[] = [];

        muTags.forEach((muTag): void => {
            belongings.push({
                uid: muTag.uid,
                name: muTag.name,
                isSafe: muTag.isSafe,
                lastSeen: muTag.lastSeen
            });
        });

        this.belongingDashboardOutput.showAll(belongings);
    }

    private async subscribeToMuTagChanges(
        muTags: Set<ProvisionedMuTag>
    ): Promise<void> {
        const account = await this.accountRepoLocal.get();
        account.muTagsChange.subscribe((change): void => {
            debugger;
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
                        this.belongingDashboardOutput.add(dashboardBelonging);
                        this.updateDashboardOnSafetyStatusChange(muTag);
                        this.updateDashboardOnAddressChange(muTag);
                    })
                    .catch((e): void => {
                        console.warn(`muTagRepoLocal.getByUid() - error: ${e}`);
                    });
            }

            if (change.deletion != null) {
                this.belongingDashboardOutput.remove(change.deletion);
            }
        });

        muTags.forEach((muTag): void => {
            this.updateDashboardOnSafetyStatusChange(muTag);
            this.updateDashboardOnAddressChange(muTag);
        });
    }

    private updateDashboardOnSafetyStatusChange(muTag: ProvisionedMuTag): void {
        muTag.safetyStatus.pipe(skip(1)).subscribe((update): void => {
            this.belongingDashboardOutput.update({
                uid: muTag.uid,
                isSafe: update.isSafe,
                lastSeen: update.lastSeen
            });
        });
    }

    private updateDashboardOnAddressChange(muTag: ProvisionedMuTag): void {
        muTag.address.subscribe(addressUpdate => {
            this.belongingDashboardOutput.update({
                uid: muTag.uid,
                address: this.addressOutput(addressUpdate)
            });
        });
    }

    private addressOutput(address: Address | undefined): string | undefined {
        //DEBUG
        console.log(
            `address.route: ${address?.route}, address.locality: ${address?.locality}, address.administrativeAreaLevel1: ${address?.administrativeAreaLevel1}`
        );
        return address == null
            ? undefined
            : `${address.route}, ${address.locality}, ${address.administrativeAreaLevel1}`;
    }
}
