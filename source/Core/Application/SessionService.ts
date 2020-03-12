import { SessionOutput } from "../Ports/SessionOutput";
import { Authentication } from "../Ports/Authentication";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { BelongingDetection } from "./BelongingDetectionService";
import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import { UserData } from "../Ports/UserData";
import UserWarning, {
    UserWarningType
} from "../../../source (restructure)/shared/metaLanguage/UserWarning";
import { Database } from "../../Secondary Adapters/Persistence/Database";
import { v4 as uuidV4 } from "uuid";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import AccountRegistrationService from "./AccountRegistrationService";
import { Subject } from "rxjs";
import Account from "../Domain/Account";
import LoginOutput from "../Ports/LoginOutput";
import * as Sentry from "@sentry/react-native";

/*export class SignedIntoOtherDevice extends UserWarning {
    name = "SignedIntoOtherDevice";
    userFriendlyMessage =
        "It looks like you are already signed into another device. Would you like to sign out of the other device and continue signing in here?";
}*/

export const SignedIntoOtherDevice: UserWarningType = {
    name: "SignedIntoOtherDevice",
    userFriendlyMessage:
        "It looks like you are already signed into another device. Would you like to sign out of the other device and continue signing in here?"
};

export interface Session {
    load(): Promise<void>;
    start(userData: UserData): Promise<void>;
    continueStart(): void;
    abortStart(): void;
    end(): Promise<void>;
    pauseLoadOnce(): void;
}

export default class SessionService implements Session {
    private readonly sessionOutput: SessionOutput;
    private readonly loginOutput: LoginOutput;
    private readonly signedOutMessage =
        "You have been signed out because your account is signed in on another device.";
    private readonly authentication: Authentication;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private readonly muTagRepoRemote: MuTagRepositoryRemote;
    private readonly belongingDetectionService: BelongingDetection;
    private readonly localDatabase: Database;
    private readonly accountRegistrationService: AccountRegistrationService;
    private shouldPauseLoadOnce = false;
    private appSessionId?: string;
    private continueNewSession?: (value: boolean) => void;

    readonly resetAllDependencies = new Subject<void>();

    constructor(
        sessionOutput: SessionOutput,
        loginOutput: LoginOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        belongingDetectionService: BelongingDetection,
        localDatabase: Database,
        accountRegistrationService: AccountRegistrationService
    ) {
        this.sessionOutput = sessionOutput;
        this.loginOutput = loginOutput;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.belongingDetectionService = belongingDetectionService;
        this.localDatabase = localDatabase;
        this.accountRegistrationService = accountRegistrationService;
    }

    async load(): Promise<void> {
        if (this.shouldPauseLoadOnce) {
            this.shouldPauseLoadOnce = false;
            return;
        }
        try {
            const account = await this.accountRepoLocal.get();
            const isAuthenticated = this.authentication.isAuthenticatedAs(
                account.uid
            );
            if (!isAuthenticated) {
                return this.end();
            }
            const remoteAccount = await this.accountRepoRemote.getByUid(
                account.uid
            );
            const sessionId = await this.getAppSessionId();
            if (sessionId == null) {
                return this.end();
            }
            if (!remoteAccount.isCurrentSession(sessionId)) {
                await this.end(false);
                this.loginOutput.showMessage(this.signedOutMessage);
                return;
            }
            this.sessionOutput.showHomeScreen();
            this.belongingDetectionService.start();
        } catch (e) {
            if (e.name === "DoesNotExist") {
                this.sessionOutput.showLoginScreen();
            } else {
                console.warn(e);
            }
        }
    }

    async start(userData: UserData): Promise<void> {
        Sentry.configureScope(scope => {
            scope.setUser({
                id: userData.uid,
                username: userData.name,
                email: userData.emailAddress
            });
        });
        let account: Account;
        try {
            account = await this.accountRepoRemote.getByUid(userData.uid);
        } catch (e) {
            if (e.name === "AccountDoesNotExistOnRemote") {
                await this.accountRegistrationService.register(
                    userData.uid,
                    userData.emailAddress,
                    userData.name
                );
                account = await this.accountRepoLocal.get();
            } else {
                throw e;
            }
        }
        let sessionId = await this.getAppSessionId();
        if (sessionId == null) {
            sessionId = await this.createAppSessionId();
            await this.setAppSessionId(sessionId);
        }
        if (account.hasActiveSession()) {
            this.loginOutput.showSignedIntoOtherDevice(
                UserWarning.create(SignedIntoOtherDevice)
            );
            const shouldContinue = await this.shouldContinueNewSession();
            if (!shouldContinue) {
                return;
            }
        }
        account.setSession(sessionId);
        await this.accountRepoRemote.update(account);
        await this.accountRepoLocal.add(account);
        const muTags = await this.muTagRepoRemote.getAll(account.uid);
        await this.muTagRepoLocal.addMultiple(muTags);
        this.sessionOutput.showHomeScreen();
        this.belongingDetectionService.start();
    }

    continueStart(): void {
        this.continueNewSession?.(true);
        this.continueNewSession = undefined;
    }

    abortStart(): void {
        this.continueNewSession?.(false);
        this.continueNewSession = undefined;
    }

    async end(saveToRemote = true): Promise<void> {
        if (saveToRemote) {
            const account = await this.accountRepoLocal.get();
            account.clearSession();
            await this.accountRepoRemote.update(account);
            const muTags = await this.muTagRepoLocal.getAll();
            await this.muTagRepoRemote.updateMultiple(
                muTags,
                account.uid,
                account.accountNumber
            );
        }
        await this.belongingDetectionService.stop();
        await this.localDatabase.destroy();
        Sentry.configureScope(scope => scope.setUser(null));
        this.resetAllDependencies.complete();
        this.sessionOutput.showLoginScreen();
    }

    private async shouldContinueNewSession(): Promise<boolean> {
        return new Promise(resolve => (this.continueNewSession = resolve));
    }

    pauseLoadOnce(): void {
        this.shouldPauseLoadOnce = true;
    }

    private async getAppSessionId(): Promise<string | undefined> {
        if (this.appSessionId != null) {
            return this.appSessionId;
        }
        this.appSessionId = await this.localDatabase.get("sessionId");
        return this.appSessionId;
    }

    private async setAppSessionId(sessionId: string): Promise<void> {
        await this.localDatabase.set("sessionId", sessionId);
    }

    private async createAppSessionId(): Promise<string> {
        return uuidV4();
    }
}
