import Account, { AccountNumber, AccountData } from "../Domain/Account";
import { Authentication } from "../Ports/Authentication";
import {
    AccountRepositoryLocal,
    DoesNotExist
} from "../Ports/AccountRepositoryLocal";
import { DoesNotExist as AccountDoesNotExistOnRemote } from "../Ports/AccountRepositoryRemote";
import { SessionOutput } from "../Ports/SessionOutput";
import SessionService from "./SessionService";
import { BeaconId } from "../Domain/ProvisionedMuTag";
import { BelongingDetection } from "./BelongingDetectionService";
import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import { UserData } from "../Ports/UserData";
import { Database } from "../../Secondary Adapters/Persistence/Database";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import AccountRegistrationService from "./AccountRegistrationService";
import { NewAccountFactory } from "../Ports/NewAccountFactory";
import LoginOutput from "../Ports/LoginOutput";

describe("user opens saved login session", (): void => {
    const SessionOutputMock = jest.fn<SessionOutput, any>(
        (): SessionOutput => ({
            showHomeScreen: jest.fn(),
            showLoginScreen: jest.fn(),
            showLoadSessionScreen: jest.fn()
        })
    );

    const LoginOutputMock = jest.fn<LoginOutput, any>(
        (): LoginOutput => ({
            showBusyIndicator: jest.fn(),
            hideBusyIndicator: jest.fn(),
            showHomeScreen: jest.fn(),
            showEmailLoginError: jest.fn(),
            showFederatedLoginError: jest.fn(),
            showMessage: jest.fn()
        })
    );

    const AuthenticationMock = jest.fn<Authentication, any>(
        (): Authentication => ({
            authenticateWithEmail: jest.fn(),
            authenticateWithFacebook: jest.fn(),
            authenticateWithGoogle: jest.fn(),
            isAuthenticatedAs: jest.fn()
        })
    );

    const AccountRepositoryLocalMock = jest.fn<AccountRepositoryLocal, any>(
        (): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        })
    );

    const AccountRepositoryRemoteMock = jest.fn<AccountRepositoryRemote, any>(
        (): AccountRepositoryRemote => ({
            getByUid: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUid: jest.fn()
        })
    );

    const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocal, any>(
        (): MuTagRepositoryLocal => ({
            getByUid: jest.fn(),
            getByBeaconId: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUid: jest.fn()
        })
    );

    const MuTagRepositoryRemoteMock = jest.fn<MuTagRepositoryRemote, any>(
        (): MuTagRepositoryRemote => ({
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
            removeByUid: jest.fn()
        })
    );

    const BelongingDetectionServiceMock = jest.fn<BelongingDetection, any>(
        (): BelongingDetection => ({
            start: jest.fn(),
            stop: jest.fn()
        })
    );

    const LocalDatabaseMock = jest.fn<Database, any>(
        (): Database => ({
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            destroy: jest.fn()
        })
    );

    const NewAccountFactoryMock = jest.fn<NewAccountFactory, any>(
        (): NewAccountFactory => ({
            create: jest.fn()
        })
    );

    const sessionOutputMock = new SessionOutputMock();
    const loginOutputMock = new LoginOutputMock();
    const authenticationMock = new AuthenticationMock();
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const accountRepoRemoteMock = new AccountRepositoryRemoteMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const muTagRepoRemoteMock = new MuTagRepositoryRemoteMock();
    const belongingDetectionServiceMock = new BelongingDetectionServiceMock();
    const localDatabaseMock = new LocalDatabaseMock();
    const newAccountFactoryMock = new NewAccountFactoryMock();

    const accountRegistrationService = new AccountRegistrationService(
        newAccountFactoryMock,
        accountRepoRemoteMock,
        accountRepoLocalMock
    );
    const accountRegistrationServiceRegisterSpy = jest.spyOn(
        accountRegistrationService,
        "register"
    );
    const sessionService = new SessionService(
        sessionOutputMock,
        loginOutputMock,
        authenticationMock,
        accountRepoLocalMock,
        accountRepoRemoteMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        belongingDetectionServiceMock,
        localDatabaseMock,
        accountRegistrationService
    );

    const recycledBeaconIds = [BeaconId.create("1")];
    const accountMuTags = ["randomUUID"];
    const currentAppSessionId = "e3ea1dd5-1c9c-48e8-a224-7b12d35c17ed";
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _nextBeaconId: BeaconId.create("3"),
        _nextSafeZoneNumber: 5,
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _name: "Kelly Cardona",
        _nextMuTagNumber: 5,
        _onboarding: false,
        _muTags: new Set(accountMuTags),
        _sessionId: currentAppSessionId
    };
    const account = new Account(validAccountData);
    const accountIsSignedIntoOtherDeviceSpy = jest.spyOn(
        account,
        "isSignedIntoOtherDevice"
    );
    const accountSetSessionSpy = jest.spyOn(account, "setSession");

    (accountRepoLocalMock.get as jest.Mock).mockResolvedValue(account);
    (authenticationMock.isAuthenticatedAs as jest.Mock).mockReturnValue(true);
    (accountRepoRemoteMock.getByUid as jest.Mock).mockResolvedValue(account);
    (localDatabaseMock.get as jest.Mock).mockResolvedValue(currentAppSessionId);

    describe("user is logged in with saved session", (): void => {
        // Given that an account is saved to local persistence

        // Given that authentication session has not expired

        // Given that user is not signed in on another device

        // When the app is opened
        //
        beforeAll(
            async (): Promise<void> => {
                await sessionService.load();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show session loading screen", (): void => {
            expect(
                sessionOutputMock.showLoadSessionScreen
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the home screen", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(authenticationMock.isAuthenticatedAs).toHaveBeenCalledWith(
                validAccountData._uid
            );
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(0);
        });

        // Then
        //
        it("should start safety status updates", (): void => {
            expect(belongingDetectionServiceMock.start).toHaveBeenCalledTimes(
                1
            );
        });
    });

    describe("no account exists in local persistence", (): void => {
        // Given that no account exists in local persistence

        // When the app is opened
        //
        beforeAll(
            async (): Promise<void> => {
                (accountRepoLocalMock.get as jest.Mock).mockRejectedValueOnce(
                    new DoesNotExist()
                );
                await sessionService.load();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show session loading screen", (): void => {
            expect(
                sessionOutputMock.showLoadSessionScreen
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the login screen", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(1);
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe("authentication session has expired", (): void => {
        // Given that an account is saved to local persistence

        // Given that authentication session has expired

        let didResetAllDependencies = false;
        const subscription = sessionService.resetAllDependencies.subscribe(
            () => (didResetAllDependencies = true)
        );

        // When the app is opened
        //
        beforeAll(
            async (): Promise<void> => {
                (authenticationMock.isAuthenticatedAs as jest.Mock).mockReturnValueOnce(
                    false
                );
                await sessionService.load();
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show session loading screen", (): void => {
            expect(
                sessionOutputMock.showLoadSessionScreen
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should save all local account data to remote persistence", (): void => {
            expect(accountRepoLocalMock.get).toHaveBeenCalledTimes(2);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(muTagRepoLocalMock.getAll).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.updateMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should stop safety status updates", (): void => {
            expect(belongingDetectionServiceMock.stop).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should delete all local persistence", (): void => {
            expect(localDatabaseMock.destroy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should reset all dependencies", (): void => {
            expect(didResetAllDependencies).toBe(true);
        });

        // Then
        //
        it("should show the login screen", (): void => {
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(1);
        });
    });

    describe("user logs in", (): void => {
        // Given that app is opened

        // When the user logs in
        //
        beforeAll(
            async (): Promise<void> => {
                account.clearSession();
                const userData: UserData = {
                    uid: validAccountData._uid,
                    emailAddress: validAccountData._emailAddress,
                    name: validAccountData._name
                };
                await sessionService.start(userData);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should verify no currently active session", (): void => {
            expect(accountIsSignedIntoOtherDeviceSpy).toHaveBeenCalledTimes(1);
        });
        // Then
        //
        it("should save new session ID to account", (): void => {
            expect(accountSetSessionSpy).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
        });

        // Then
        //
        it("should save all account data from remote to local persistence", (): void => {
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show the home screen", (): void => {
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(1);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(0);
        });

        // Then
        //
        it("should start safety status updates", (): void => {
            expect(belongingDetectionServiceMock.start).toHaveBeenCalledTimes(
                1
            );
        });
    });

    describe("user is signed in on other device", (): void => {
        // Given that an account is saved to local persistence

        // Given that authentication session has not expired

        // Given that user is signed in on another device

        let didResetAllDependencies = false;
        const subscription = sessionService.resetAllDependencies.subscribe(
            () => (didResetAllDependencies = true)
        );

        // When the app is opened
        //
        beforeAll(
            async (): Promise<void> => {
                account.setSession("ed8817d6-d822-460d-9ba9-04fd6f94aac6");
                await sessionService.load();
            }
        );

        afterAll((): void => {
            subscription.unsubscribe();
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show session loading screen", (): void => {
            expect(
                sessionOutputMock.showLoadSessionScreen
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should stop safety status updates", (): void => {
            expect(belongingDetectionServiceMock.stop).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should delete all local persistence", (): void => {
            expect(localDatabaseMock.destroy).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should reset all dependencies", (): void => {
            expect(didResetAllDependencies).toBe(true);
        });

        // Then
        //
        it("should show the login screen", (): void => {
            expect(sessionOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            expect(sessionOutputMock.showLoginScreen).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show message that user has been signed into another device", (): void => {
            expect(loginOutputMock.showMessage).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showMessage).toHaveBeenCalledWith(
                "You have been signed out because your account is signed in on another device."
            );
        });
    });

    describe("account does not exist", (): void => {
        // Given that no account is logged in

        // Given that credentials are valid for authentication

        // Given that an account does not exist for the provided credentials

        const userData: UserData = {
            uid: validAccountData._uid,
            emailAddress: validAccountData._emailAddress,
            name: validAccountData._name
        };

        // When the user starts session
        //
        beforeAll(
            async (): Promise<void> => {
                (accountRepoRemoteMock.getByUid as jest.Mock).mockRejectedValueOnce(
                    new AccountDoesNotExistOnRemote()
                );
                account.clearSession();
                await sessionService.start(userData);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should register new account", (): void => {
            expect(accountRegistrationServiceRegisterSpy).toHaveBeenCalledTimes(
                1
            );
            expect(accountRegistrationServiceRegisterSpy).toHaveBeenCalledWith(
                userData.uid,
                userData.emailAddress,
                userData.name
            );
        });
    });
});
