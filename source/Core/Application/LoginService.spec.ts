import {
    LoginService,
    EmailAddress,
    Password,
    ImproperEmailFormat,
    ImproperPasswordComplexity
} from "./LoginService";
import {
    AccountRepositoryRemote,
    DoesNotExist
} from "../Ports/AccountRepositoryRemote";
import Account, { AccountNumber, AccountData } from "../Domain/Account";
import {
    Authentication,
    InvalidCredentials,
    SignInCanceled
} from "../Ports/Authentication";
import { LoginOutput } from "../Ports/LoginOutput";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import ProvisionedMuTag, { BeaconId } from "../Domain/ProvisionedMuTag";
import { MuTagColor } from "../Domain/MuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { Session } from "./SessionService";
import { UserData } from "../Ports/UserData";
import AccountRegistrationService from "./AccountRegistrationService";

jest.mock("./AccountRegistrationService");

describe("user logs into their account", (): void => {
    const LoginOutputMock = jest.fn<LoginOutput, any>(
        (): LoginOutput => ({
            showBusyIndicator: jest.fn(),
            hideBusyIndicator: jest.fn(),
            showHomeScreen: jest.fn(),
            showEmailLoginError: jest.fn(),
            showFederatedLoginError: jest.fn()
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
            getByUID: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const MuTagRepositoryLocalMock = jest.fn<MuTagRepositoryLocal, any>(
        (): MuTagRepositoryLocal => ({
            getByUID: jest.fn(),
            getByBeaconID: jest.fn(),
            getAll: jest.fn(),
            add: jest.fn(),
            addMultiple: jest.fn(),
            update: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const MuTagRepositoryRemoteMock = jest.fn<MuTagRepositoryRemote, any>(
        (): MuTagRepositoryRemote => ({
            getAll: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            updateMultiple: jest.fn(),
            removeByUID: jest.fn()
        })
    );

    const SessionServiceMock = jest.fn<Session, any>(
        (): Session => ({
            load: jest.fn(),
            start: jest.fn(),
            pauseLoadOnce: jest.fn()
        })
    );

    const AccountRegistrationServiceMock = AccountRegistrationService as jest.Mock<
        AccountRegistrationService,
        any
    >;

    const loginOutputMock = new LoginOutputMock();
    const authenticationMock = new AuthenticationMock();
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const accountRepoRemoteMock = new AccountRepositoryRemoteMock();
    const muTagRepoLocalMock = new MuTagRepositoryLocalMock();
    const muTagRepoRemoteMock = new MuTagRepositoryRemoteMock();
    const sessionServiceMock = new SessionServiceMock();
    const accountRegistrationServiceMock = new AccountRegistrationServiceMock();

    const loginService = new LoginService(
        loginOutputMock,
        authenticationMock,
        accountRepoLocalMock,
        accountRepoRemoteMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        sessionServiceMock,
        accountRegistrationServiceMock
    );

    const muTags = new Set([
        new ProvisionedMuTag({
            _uid: "randomUUID01",
            _beaconID: BeaconId.create("0"),
            _muTagNumber: 0,
            _name: "Keys",
            _batteryLevel: new Percent(50),
            _isSafe: true,
            _lastSeen: new Date(),
            _color: MuTagColor.MuOrange
        }),
        new ProvisionedMuTag({
            _uid: "randomUUID02",
            _beaconID: BeaconId.create("1"),
            _muTagNumber: 1,
            _name: "Laptop",
            _batteryLevel: new Percent(50),
            _isSafe: true,
            _lastSeen: new Date(),
            _color: MuTagColor.MuOrange
        })
    ]);
    const recycledBeaconIDs = [BeaconId.create("2"), BeaconId.create("5")];
    const accountMuTags = ["randomUUID01", "randomUUID02"];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _nextBeaconID: BeaconId.create("A"),
        _recycledBeaconIDs: new Set(recycledBeaconIDs),
        _nextMuTagNumber: 15,
        _muTags: new Set(accountMuTags)
    };
    const account = new Account(validAccountData);
    const validEmail = new EmailAddress("support+test@informu.io");
    const validPassword = new Password("testPassword!");

    describe("credentials are valid (email)", (): void => {
        // Given that no account is logged in

        // Given credentials are valid for authentication
        //
        const userData: UserData = {
            uid: validAccountData._uid,
            emailAddress: validAccountData._emailAddress
        };
        (authenticationMock.authenticateWithEmail as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUID as jest.Mock).mockResolvedValueOnce(
            account
        );
        (muTagRepoRemoteMock.getAll as jest.Mock).mockResolvedValueOnce(muTags);

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithEmail(validEmail, validPassword);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should save account login locally", (): void => {
            expect(
                authenticationMock.authenticateWithEmail
            ).toHaveBeenCalledWith(
                validEmail.rawValue(),
                validPassword.rawValue()
            );
            expect(
                authenticationMock.authenticateWithEmail
            ).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledWith(
                userData.uid
            );
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledTimes(1);
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledWith(
                userData.uid
            );
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledWith(muTags);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should start login session", (): void => {
            expect(sessionServiceMock.start).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                0
            );
            expect(
                loginOutputMock.showFederatedLoginError
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe("credentials are valid (Facebook)", (): void => {
        // Given that no account is logged in

        // Given credentials are valid for authentication
        //
        const userData: UserData = {
            uid: validAccountData._uid,
            emailAddress: validAccountData._emailAddress
        };
        (authenticationMock.authenticateWithFacebook as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUID as jest.Mock).mockResolvedValueOnce(
            account
        );
        (muTagRepoRemoteMock.getAll as jest.Mock).mockResolvedValueOnce(muTags);

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithFacebook();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should save account login locally", (): void => {
            expect(
                authenticationMock.authenticateWithFacebook
            ).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledWith(
                userData.uid
            );
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledTimes(1);
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledWith(
                userData.uid
            );
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledWith(muTags);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should start login session", (): void => {
            expect(sessionServiceMock.start).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                0
            );
            expect(
                loginOutputMock.showFederatedLoginError
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe("credentials are valid (Google)", (): void => {
        // Given that no account is logged in

        // Given credentials are valid for authentication
        //
        const userData: UserData = {
            uid: validAccountData._uid,
            emailAddress: validAccountData._emailAddress
        };
        (authenticationMock.authenticateWithGoogle as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUID as jest.Mock).mockResolvedValueOnce(
            account
        );
        (muTagRepoRemoteMock.getAll as jest.Mock).mockResolvedValueOnce(muTags);

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithGoogle();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should save account login locally", (): void => {
            expect(
                authenticationMock.authenticateWithGoogle
            ).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledWith(
                userData.uid
            );
            expect(accountRepoRemoteMock.getByUID).toHaveBeenCalledTimes(1);
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledWith(
                userData.uid
            );
            expect(muTagRepoRemoteMock.getAll).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledWith(muTags);
            expect(muTagRepoLocalMock.addMultiple).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should start login session", (): void => {
            expect(sessionServiceMock.start).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                0
            );
            expect(
                loginOutputMock.showFederatedLoginError
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe("email credentials are invalid", (): void => {
        // Given that no account is logged in

        // Given credentials meet input validation requirements

        // Given credentials are invalid for authentication
        //
        const invalidPassword = new Password("testPassword@");
        (authenticationMock.authenticateWithEmail as jest.Mock).mockRejectedValueOnce(
            new InvalidCredentials()
        );

        // Given an account exists for the provided credentials

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithEmail(validEmail, invalidPassword);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show a message that the log in attempt failed due to invalid credentials", (): void => {
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                1
            );
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledWith(
                new InvalidCredentials()
            );
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
        });
    });

    describe("email credentials fail input validation", (): void => {
        describe("improper email address", (): void => {
            // Given that no account is logged in

            // Given credentials do not meet input validation requirements
            //
            const improperEmail = new EmailAddress("support+test.informu.io");

            // When the user submits credentials
            //
            beforeAll(
                async (): Promise<void> => {
                    await loginService.signInWithEmail(
                        improperEmail,
                        validPassword
                    );
                }
            );

            afterAll((): void => {
                jest.clearAllMocks();
            });

            // Then
            //
            it("should show a message that an improper email address was entered", (): void => {
                expect(
                    loginOutputMock.showEmailLoginError
                ).toHaveBeenCalledTimes(1);
                expect(
                    loginOutputMock.showEmailLoginError
                ).toHaveBeenCalledWith(new ImproperEmailFormat());
                expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            });
        });

        describe("improper password complexity", (): void => {
            // Given that no account is logged in

            // Given credentials do not meet input validation requirements
            //
            const improperPassword = new Password("password");

            // When the user submits credentials
            //
            beforeAll(
                async (): Promise<void> => {
                    await loginService.signInWithEmail(
                        validEmail,
                        improperPassword
                    );
                }
            );

            afterAll((): void => {
                jest.clearAllMocks();
            });

            // Then
            //
            it("should show a message that password doesn't meet complexity requirements", (): void => {
                expect(
                    loginOutputMock.showEmailLoginError
                ).toHaveBeenCalledTimes(1);
                expect(
                    loginOutputMock.showEmailLoginError
                ).toHaveBeenCalledWith(new ImproperPasswordComplexity());
                expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe("account does not exist for email authentication", (): void => {
        // Given that no account is logged in

        // Given credentials meet input validation requirements
        //
        const newEmail = new EmailAddress("support+test2@informu.io");
        const newPassword = new Password("lollipops23");

        // Given an account does not exists for the provided credentials
        //
        (authenticationMock.authenticateWithEmail as jest.Mock).mockRejectedValueOnce(
            new InvalidCredentials()
        );

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithEmail(newEmail, newPassword);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show a message that the log in attempt failed due to invalid credentials", (): void => {
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                1
            );
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledWith(
                new InvalidCredentials()
            );
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
        });
    });

    describe("account does not exist for federated authentication (Google)", (): void => {
        // Given that no account is logged in

        // Given that user has launched federated authentication option

        // Given that credentials are valid for authentication
        const userData: UserData = {
            uid: "YVbsaRtrg5Ssn6BuROngSrdUHUB2",
            emailAddress: "newUser@gmail.com"
        };
        (authenticationMock.authenticateWithGoogle as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given that an account does not exist for the provided credentials
        (accountRepoRemoteMock.getByUID as jest.Mock).mockRejectedValueOnce(
            new DoesNotExist()
        );

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithGoogle();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should register new account", (): void => {
            expect(
                accountRegistrationServiceMock.registerFederated
            ).toHaveBeenCalledTimes(1);
            expect(
                accountRegistrationServiceMock.registerFederated
            ).toHaveBeenCalledWith(userData.uid, userData.emailAddress);
        });

        // Then
        //
        it("should start login session", (): void => {
            expect(sessionServiceMock.start).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                0
            );
            expect(
                loginOutputMock.showFederatedLoginError
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe("account does not exist for federated authentication (Facebook)", (): void => {
        // Given that no account is logged in

        // Given that user has launched federated authentication option

        // Given that credentials are valid for authentication
        const userData: UserData = {
            uid: "Z8b0C6BB7pMwTFwlyMShdnOPQ7V2",
            emailAddress: "newUser2@gmail.com"
        };
        (authenticationMock.authenticateWithFacebook as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given that an account does not exist for the provided credentials
        (accountRepoRemoteMock.getByUID as jest.Mock).mockRejectedValueOnce(
            new DoesNotExist()
        );

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithFacebook();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(loginOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should register new account", (): void => {
            expect(
                accountRegistrationServiceMock.registerFederated
            ).toHaveBeenCalledTimes(1);
            expect(
                accountRegistrationServiceMock.registerFederated
            ).toHaveBeenCalledWith(userData.uid, userData.emailAddress);
        });

        // Then
        //
        it("should start login session", (): void => {
            expect(sessionServiceMock.start).toHaveBeenCalledTimes(1);
            expect(loginOutputMock.showEmailLoginError).toHaveBeenCalledTimes(
                0
            );
            expect(
                loginOutputMock.showFederatedLoginError
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe("federated authentication is canceled", (): void => {
        // Given that no account is logged in

        // Given that user has launched federated authentication option

        // Given that credentials are valid for authentication
        (authenticationMock.authenticateWithFacebook as jest.Mock).mockRejectedValueOnce(
            new SignInCanceled()
        );
        (authenticationMock.authenticateWithGoogle as jest.Mock).mockRejectedValueOnce(
            new SignInCanceled()
        );

        // When the user submits credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await loginService.signInWithFacebook();
                await loginService.signInWithGoogle();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should hide activity indicator", (): void => {
            expect(loginOutputMock.hideBusyIndicator).toHaveBeenCalledTimes(2);
        });
    });
});
