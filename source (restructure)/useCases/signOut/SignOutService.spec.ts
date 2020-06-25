import SignOutInteractor from "./SignOutInteractor";
import { SignOutOutput } from "./SignOutOutput";
import { Session } from "../../../source/Core/Application/SessionService";

jest.mock("../../Secondary Adapters/Persistence/DatabaseImplWatermelon");
jest.mock("./BelongingDetectionService");

describe("user logs out of their account", (): void => {
    const LogoutOutputMock = jest.fn<SignOutOutput, any>(
        (): SignOutOutput => ({
            showBusyIndicator: jest.fn(),
            showLogoutComplete: jest.fn()
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

    const sessionServiceMock = new SessionServiceMock();
    const logoutOutputMock = new LogoutOutputMock();
    const logoutService = new SignOutInteractor(
        logoutOutputMock,
        sessionServiceMock
    );

    describe("user is logged in", (): void => {
        // Given that an account is logged in

        // When the user submits log out
        //
        beforeAll(
            async (): Promise<void> => {
                await logoutService.logOut();
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", (): void => {
            expect(logoutOutputMock.showBusyIndicator).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should end session", (): void => {
            expect(sessionServiceMock.end).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show login option", (): void => {
            expect(logoutOutputMock.showLogoutComplete).toHaveBeenCalledTimes(
                1
            );
        });
    });
});
