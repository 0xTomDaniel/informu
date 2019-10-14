import { LogoutOutput } from '../Ports/LogoutOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import { RepositoryLocal } from '../Ports/RepositoryLocal';

export default class LogoutService {

    private readonly logoutOutput: LogoutOutput;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly repoLocal: RepositoryLocal;

    constructor(
        logoutOutput: LogoutOutput,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        repoLocal: RepositoryLocal,
    ) {
        this.logoutOutput = logoutOutput;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.repoLocal = repoLocal;
    }

    async logOut(): Promise<void> {
        this.logoutOutput.showBusyIndicator();

        const account = await this.accountRepoLocal.get();
        await this.accountRepoRemote.update(account);

        const muTags = await this.muTagRepoLocal.getAll();
        const accountUID = account.getUID();
        await this.muTagRepoRemote.updateMultiple(muTags, accountUID);

        await this.repoLocal.erase();

        this.logoutOutput.showLogoutComplete();
    }
}
