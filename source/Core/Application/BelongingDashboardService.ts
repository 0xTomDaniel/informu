import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { BelongingDashboardOutput, DashboardBelonging } from '../Ports/BelongingDashboardOutput';

export default class BelongingDashboardService {

    //private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly belongingDashboardOutput: BelongingDashboardOutput;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;

    constructor(
        //accountRepoLocal: AccountRepositoryLocal,
        belongingDashboardOutput: BelongingDashboardOutput,
        muTagRepoLocal: MuTagRepositoryLocal,
    ) {
        //this.accountRepoLocal = accountRepoLocal;
        this.belongingDashboardOutput = belongingDashboardOutput;
        this.muTagRepoLocal = muTagRepoLocal;
    }

    async open(): Promise<void> {
        const muTags = await this.muTagRepoLocal.getAll();
        const belongings: DashboardBelonging[] = [];

        muTags.forEach((muTag): void => {
            belongings.push({
                uid: muTag.getUID(),
                name: muTag.getName(),
                isSafe: muTag.getIsSafe(),
                lastSeen: muTag.getLastSeen(),
            });
        });

        // DEBUG
        console.log(muTags);
        console.log(belongings);

        this.belongingDashboardOutput.showAll(belongings);
    }
}
