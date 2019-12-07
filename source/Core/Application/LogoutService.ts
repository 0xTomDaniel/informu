import { LogoutOutput } from '../Ports/LogoutOutput';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { AccountRepositoryRemote } from '../Ports/AccountRepositoryRemote';
import { MuTagRepositoryLocal } from '../Ports/MuTagRepositoryLocal';
import { MuTagRepositoryRemote } from '../Ports/MuTagRepositoryRemote';
import DatabaseImplWatermelon from '../../Secondary Adapters/Persistence/DatabaseImplWatermelon';

export default class LogoutService {

    private readonly logoutOutput: LogoutOutput;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly database: DatabaseImplWatermelon;

    private onResetAllDependenciesCallback?: () => void;

    constructor(
        logoutOutput: LogoutOutput,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        database: DatabaseImplWatermelon,
    ) {
        this.logoutOutput = logoutOutput;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.database = database;
    }

    async logOut(): Promise<void> {
        this.logoutOutput.showBusyIndicator();

        const account = await this.accountRepoLocal.get();
        await this.accountRepoRemote.update(account);

        const muTags = await this.muTagRepoLocal.getAll();
        const accountUID = account.uid;
        await this.muTagRepoRemote.updateMultiple(muTags, accountUID);

        await this.database.destroy();
        this.resetAllDependencies();

        this.logoutOutput.showLogoutComplete();
    }

    onResetAllDependencies(callback: (() => void) | undefined): void {
        this.onResetAllDependenciesCallback = callback;
    }

    private resetAllDependencies(): void {
        this.onResetAllDependenciesCallback != null
            && this.onResetAllDependenciesCallback();
    }
}
