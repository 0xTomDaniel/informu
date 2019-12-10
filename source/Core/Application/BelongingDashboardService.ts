import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import {
    BelongingDashboardOutput,
    DashboardBelonging
} from "../Ports/BelongingDashboardOutput";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import ProvisionedMuTag from "../Domain/ProvisionedMuTag";

export default class BelongingDashboardService {
    private readonly belongingDashboardOutput: BelongingDashboardOutput;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        belongingDashboardOutput: BelongingDashboardOutput,
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
            if (change.insertion != null) {
                this.muTagRepoLocal
                    .getByUID(change.insertion)
                    .then((muTag): void => {
                        const dashboardBelonging = {
                            uid: muTag.uid,
                            name: muTag.name,
                            isSafe: muTag.isSafe,
                            lastSeen: muTag.lastSeen
                        };
                        this.belongingDashboardOutput.add(dashboardBelonging);
                        this.updateDashboardOnSafetyStatusChange(muTag);
                    })
                    .catch((e): void => {
                        console.warn(`muTagRepoLocal.getByUID() - error: ${e}`);
                    });
            }

            if (change.deletion != null) {
                this.belongingDashboardOutput.remove(change.deletion);
            }
        });

        muTags.forEach((muTag): void => {
            this.updateDashboardOnSafetyStatusChange(muTag);
        });
    }

    private updateDashboardOnSafetyStatusChange(muTag: ProvisionedMuTag): void {
        muTag.safetyStatus.subscribe((update): void => {
            this.belongingDashboardOutput.update({
                uid: muTag.uid,
                isSafe: update.isSafe,
                lastSeen: update.lastSeen
            });
        });
    }
}
