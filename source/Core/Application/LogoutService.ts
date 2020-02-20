import { LogoutOutput } from "../Ports/LogoutOutput";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import BelongingDetectionService from "./BelongingDetectionService";
import { Database } from "../../Secondary Adapters/Persistence/Database";

export default class LogoutService {
    private readonly logoutOutput: LogoutOutput;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly database: Database;
    private readonly belongingDetectionService: BelongingDetectionService;

    private onResetAllDependenciesCallback?: () => void;

    constructor(
        logoutOutput: LogoutOutput,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        database: Database,
        belongingDetectionService: BelongingDetectionService
    ) {
        this.logoutOutput = logoutOutput;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.database = database;
        this.belongingDetectionService = belongingDetectionService;
    }

    async logOut(): Promise<void> {
        // TODO: Use SessionInteractor to delete account data
        this.logoutOutput.showBusyIndicator();

        const account = await this.accountRepoLocal.get();
        await this.accountRepoRemote.update(account);

        const muTags = await this.muTagRepoLocal.getAll();
        await this.muTagRepoRemote.updateMultiple(
            muTags,
            account.uid,
            account.accountNumber
        );

        await this.belongingDetectionService.stop();
        await this.database.destroy();
        this.resetAllDependencies();

        this.logoutOutput.showLogoutComplete();
    }

    onResetAllDependencies(callback: (() => void) | undefined): void {
        this.onResetAllDependenciesCallback = callback;
    }

    private resetAllDependencies(): void {
        this.onResetAllDependenciesCallback?.();
    }
}
