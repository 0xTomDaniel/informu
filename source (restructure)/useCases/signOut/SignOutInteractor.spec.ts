import { SignOutInteractorImpl } from "./SignOutInteractor";
import SessionService from "../../../source/Core/Application/SessionService";

const SessionServiceMock = jest.fn<SessionService, any>(
    (): SessionService => ({
        load: jest.fn(),
        start: jest.fn(),
        continueStart: jest.fn(),
        abortStart: jest.fn(),
        end: jest.fn(),
        pauseLoadOnce: jest.fn()
    })
);
const sessionServiceMock = new SessionServiceMock();
(sessionServiceMock.end as jest.Mock).mockResolvedValue(undefined);
const signOutInteractor = new SignOutInteractorImpl(sessionServiceMock);

describe("User signs out of their account.", () => {
    describe("User is signed in.", () => {
        // Given that an account is logged in

        let signOutInteractorPromise: Promise<void>;

        // When the user submits log out
        //
        beforeAll(async () => {
            signOutInteractorPromise = signOutInteractor.signOut();
        });

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("Should end session.", async () => {
            expect.assertions(1);
            await expect(signOutInteractorPromise).resolves.toBeUndefined();
        });
    });
});
