import { SessionOutput } from "../Ports/SessionOutput";
import { Authentication } from "../Ports/Authentication";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { BelongingDetection } from "./BelongingDetectionService";
import AccountRepositoryRemote from "../Ports/AccountRepositoryRemote";
import { UserData } from "../Ports/UserData";
import { Database } from "../../Secondary Adapters/Persistence/Database";
import { v4 as uuidV4 } from "uuid";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import AccountRegistrationService from "./AccountRegistrationService";
import { Subject } from "rxjs";
import Account from "../Domain/Account";
import LoginOutput from "../Ports/LoginOutput";
import EventTracker from "../../../source (restructure)/shared/metaLanguage/EventTracker";
import { BelongingsLocation } from "../../../source (restructure)/useCases/updateBelongingsLocation/BelongingsLocationInteractor";
import MuTagBatteriesInteractor from "../../../source (restructure)/useCases/updateMuTagBatteries/MuTagBatteriesInteractor";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

const ExceptionType = ["SignedIntoOtherDevice"] as const;
type ExceptionType = typeof ExceptionType[number];

class SessionServiceException<T extends ExceptionType> extends Exception<T> {
    static get SignedIntoOtherDevice(): SessionServiceException<
        "SignedIntoOtherDevice"
    > {
        return new this(
            "SignedIntoOtherDevice",
            "Account is already signed into another device.",
            "warn",
            undefined,
            true
        );
    }
}

// "It looks like you are already signed into another device. Would you like to sign out of the other device and continue signing in here?"

export default interface SessionService {
    abortStart(): void;
    continueStart(): void;
    end(): Promise<void>;
    load(): Promise<void>;
    pauseLoadOnce(): void;
    start(userData: UserData): Promise<void>;
}

export class SessionServiceImpl implements SessionService {
    readonly resetAllDependencies = new Subject<void>();

    constructor(
        eventTracker: EventTracker,
        sessionOutput: SessionOutput,
        loginOutput: LoginOutput,
        authentication: Authentication,
        accountRepoLocal: AccountRepositoryLocal,
        accountRepoRemote: AccountRepositoryRemote,
        muTagRepoLocal: MuTagRepositoryLocal,
        muTagRepoRemote: MuTagRepositoryRemote,
        belongingDetectionService: BelongingDetection,
        belongingsLocationInteractor: BelongingsLocation,
        localDatabase: Database,
        accountRegistrationService: AccountRegistrationService,
        muTagBatteriesInteractor: MuTagBatteriesInteractor
    ) {
        this.eventTracker = eventTracker;
        this.sessionOutput = sessionOutput;
        this.loginOutput = loginOutput;
        this.authentication = authentication;
        this.accountRepoLocal = accountRepoLocal;
        this.accountRepoRemote = accountRepoRemote;
        this.muTagRepoLocal = muTagRepoLocal;
        this.muTagRepoRemote = muTagRepoRemote;
        this.belongingDetectionService = belongingDetectionService;
        this.belongingsLocationInteractor = belongingsLocationInteractor;
        this.localDatabase = localDatabase;
        this.accountRegistrationService = accountRegistrationService;
        this.muTagBatteriesInteractor = muTagBatteriesInteractor;
    }

    abortStart(): void {
        this.continueNewSession?.(false);
        this.continueNewSession = undefined;
    }

    continueStart(): void {
        this.continueNewSession?.(true);
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
        this.belongingsLocationInteractor.stop();
        this.muTagBatteriesInteractor.stop();
        await this.localDatabase.destroy();
        this.eventTracker.removeUser();
        this.resetAllDependencies.complete();
        this.sessionOutput.showLoginScreen();
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
            await this.belongingDetectionService.start();
            await this.belongingsLocationInteractor.start();
            await this.muTagBatteriesInteractor.start();
        } catch (e) {
            if (e.name === "DoesNotExist") {
                this.sessionOutput.showLoginScreen();
            } else {
                console.warn(e);
            }
        }
    }

    pauseLoadOnce(): void {
        this.shouldPauseLoadOnce = true;
    }

    async start(userData: UserData): Promise<void> {
        this.eventTracker.setUser({
            id: userData.uid,
            username: userData.name,
            email: userData.emailAddress
        });
        let account: Account;
        try {
            account = await this.accountRepoRemote.getByUid(userData.uid);
        } catch (e) {
            if (e.name === "DoesNotExist") {
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
            sessionId = await This.createAppSessionId();
            await this.setAppSessionId(sessionId);
        }
        if (account.hasActiveSession()) {
            this.loginOutput.showSignedIntoOtherDevice(
                SessionServiceException.SignedIntoOtherDevice
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
        await this.belongingDetectionService.start();
        await this.belongingsLocationInteractor.start();
        await this.muTagBatteriesInteractor.start();
    }

    private readonly eventTracker: EventTracker;
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
    private readonly belongingsLocationInteractor: BelongingsLocation;
    private readonly localDatabase: Database;
    private readonly accountRegistrationService: AccountRegistrationService;
    private readonly muTagBatteriesInteractor: MuTagBatteriesInteractor;
    private shouldPauseLoadOnce = false;
    private appSessionId?: string;
    private continueNewSession?: (value: boolean) => void;

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

    private async shouldContinueNewSession(): Promise<boolean> {
        return new Promise(resolve => (this.continueNewSession = resolve));
    }

    private static async createAppSessionId(): Promise<string> {
        return uuidV4();
    }
}

const This = SessionServiceImpl;
