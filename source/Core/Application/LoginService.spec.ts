import {
    LoginService,
    EmailAddress,
    Password,
    ImproperEmailFormat,
    ImproperPasswordComplexity
} from "./LoginService";
import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import Account, { AccountNumber, AccountData } from "../Domain/Account";
import {
    Authentication,
    InvalidCredentials,
    SignInCanceled
} from "../Ports/Authentication";
import LoginOutput from "../Ports/LoginOutput";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import ProvisionedMuTag, { BeaconId } from "../Domain/ProvisionedMuTag";
import { MuTagColor } from "../Domain/MuTag";
import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";
import { MuTagRepositoryRemote } from "../Ports/MuTagRepositoryRemote";
import { MuTagRepositoryLocal } from "../Ports/MuTagRepositoryLocal";
import { Session } from "./SessionService";
import { UserData } from "../Ports/UserData";
import AccountRegistrationService from "./AccountRegistrationService";
import EventTracker from "../../../source (restructure)/shared/metaLanguage/EventTracker";
import Logger from "../../../source (restructure)/shared/metaLanguage/Logger";
import UserWarning from "../../../source (restructure)/shared/metaLanguage/UserWarning";
import UserError from "../../../source (restructure)/shared/metaLanguage/UserError";

jest.mock("./AccountRegistrationService");

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
const logger = new Logger(eventTrackerMock);
UserWarning.logger = logger;
UserError.logger = logger;

describe("user logs into their account", (): void => {
    const LoginOutputMock = jest.fn<LoginOutput, any>(
        (): LoginOutput => ({
            showBusyIndicator: jest.fn(),
            hideBusyIndicator: jest.fn(),
            showHomeScreen: jest.fn(),
            showEmailLoginError: jest.fn(),
            showSignedIntoOtherDevice: jest.fn(),
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

    const SessionServiceMock = jest.fn<Session, any>(
        (): Session => ({
            load: jest.fn(),
            start: jest.fn(),
            continueStart: jest.fn(),
            abortStart: jest.fn(),
            end: jest.fn(),
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

    const dateNow = new Date();
    const muTags = new Set([
        new ProvisionedMuTag({
            _advertisingInterval: 1,
            _batteryLevel: new Percent(50),
            _beaconId: BeaconId.create("0"),
            _color: MuTagColor.MuOrange,
            _dateAdded: dateNow,
            _didExitRegion: false,
            _firmwareVersion: "1.6.1",
            _isSafe: true,
            _lastSeen: dateNow,
            _macAddress: "63BCEF52ACD3",
            _modelNumber: "REV8",
            _muTagNumber: 0,
            _name: "Keys",
            _recentLatitude: 0,
            _recentLongitude: 0,
            _txPower: 1,
            _uid: "randomUUID01"
        }),
        new ProvisionedMuTag({
            _advertisingInterval: 1,
            _batteryLevel: new Percent(50),
            _beaconId: BeaconId.create("1"),
            _color: MuTagColor.MuOrange,
            _dateAdded: dateNow,
            _didExitRegion: false,
            _firmwareVersion: "1.6.1",
            _isSafe: true,
            _lastSeen: dateNow,
            _macAddress: "63BCEF522CD3",
            _modelNumber: "REV8",
            _muTagNumber: 1,
            _name: "Laptop",
            _recentLatitude: 0,
            _recentLongitude: 0,
            _txPower: 1,
            _uid: "randomUUID02"
        })
    ]);
    const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
    const accountMuTags = ["randomUUID01", "randomUUID02"];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _name: "Brenda Gorscia",
        _nextBeaconId: BeaconId.create("A"),
        _nextSafeZoneNumber: 4,
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _nextMuTagNumber: 15,
        _onboarding: false,
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
            emailAddress: validAccountData._emailAddress,
            name: validAccountData._name
        };
        (authenticationMock.authenticateWithEmail as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUid as jest.Mock).mockResolvedValueOnce(
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
        it("should authenticate with credentials", (): void => {
            expect(
                authenticationMock.authenticateWithEmail
            ).toHaveBeenCalledWith(
                validEmail.rawValue(),
                validPassword.rawValue()
            );
            expect(
                authenticationMock.authenticateWithEmail
            ).toHaveBeenCalledTimes(1);
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
            emailAddress: validAccountData._emailAddress,
            name: validAccountData._name
        };
        (authenticationMock.authenticateWithFacebook as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUid as jest.Mock).mockResolvedValueOnce(
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
        it("should authenticate with credentials", (): void => {
            expect(
                authenticationMock.authenticateWithFacebook
            ).toHaveBeenCalledTimes(1);
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
            emailAddress: validAccountData._emailAddress,
            name: validAccountData._name
        };
        (authenticationMock.authenticateWithGoogle as jest.Mock).mockResolvedValueOnce(
            userData
        );

        // Given an account exists for the provided credentials
        //
        (accountRepoRemoteMock.getByUid as jest.Mock).mockResolvedValueOnce(
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
        it("should authenticate with credentials", (): void => {
            expect(
                authenticationMock.authenticateWithGoogle
            ).toHaveBeenCalledTimes(1);
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
            UserError.create(InvalidCredentials)
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
                UserError.create(InvalidCredentials)
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
                ).toHaveBeenCalledWith(UserError.create(ImproperEmailFormat));
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
                ).toHaveBeenCalledWith(
                    UserError.create(ImproperPasswordComplexity)
                );
                expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe("credentials do not exist for email authentication", (): void => {
        // Given that no account is logged in

        // Given credentials meet input validation requirements
        //
        const newEmail = new EmailAddress("support+test2@informu.io");
        const newPassword = new Password("lollipops23");

        // Given an account does not exists for the provided credentials
        //
        (authenticationMock.authenticateWithEmail as jest.Mock).mockRejectedValueOnce(
            UserError.create(InvalidCredentials)
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
                UserError.create(InvalidCredentials)
            );
            expect(loginOutputMock.showHomeScreen).toHaveBeenCalledTimes(0);
        });
    });

    describe("federated authentication is canceled", (): void => {
        // Given that no account is logged in

        // Given that user has launched federated authentication option

        // Given that credentials are valid for authentication
        (authenticationMock.authenticateWithFacebook as jest.Mock).mockRejectedValueOnce(
            UserError.create(SignInCanceled)
        );
        (authenticationMock.authenticateWithGoogle as jest.Mock).mockRejectedValueOnce(
            UserError.create(SignInCanceled)
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
