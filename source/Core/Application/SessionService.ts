import { SessionOutput } from '../Ports/SessionOutput';
import { Authentication } from '../Ports/Authentication';
import { AccountRepositoryLocal } from '../Ports/AccountRepositoryLocal';
import { DoesNotExist } from '../Ports/AccountRepositoryLocal';

export interface Session {

    load(): Promise<void>;
    start(): Promise<void>;
}

export default class SessionService implements Session {

    private readonly sessionOutput: SessionOutput;
    private readonly authentication: Authentication;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        sessionOutput: SessionOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.sessionOutput = sessionOutput;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
    }

    async load(): Promise<void> {
        this.sessionOutput.showLoadSessionScreen();

        try {
            const account = await this.accountRepoLocal.get();
            const isLoggedIn = await this.authentication.isAuthenticatedAs(account.uid);

            if (isLoggedIn) {
                this.sessionOutput.showHomeScreen();
            } else {
                await this.accountRepoLocal.remove();
                this.sessionOutput.showLoginScreen();
            }
        } catch (e) {
            if (e instanceof DoesNotExist) {
                this.sessionOutput.showLoginScreen();
            } else {
                throw e;
            }
        }
    }

    async start(): Promise<void> {
        this.sessionOutput.showHomeScreen();
    }
}
