import { SignOutInteractorImpl } from "./SignOutInteractor";
import SessionService from "../../../source/Core/Application/SessionService";
import { take, skip } from "rxjs/operators";

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

describe("user signs out of their account", (): void => {
    describe("user is signed in", (): void => {
        // Given that an account is logged in

        let didShowActivityIndicator = false;
        let didHideActivityIndicator = false;
        let didShowSignIn = false;

        // When the user submits log out
        //
        beforeAll(
            async (): Promise<void> => {
                await new Promise((resolve, reject) => {
                    let completeCount = 0;
                    const resolveAfterAll = (): void => {
                        completeCount += 1;
                        if (completeCount === 4) {
                            resolve();
                        }
                    };
                    signOutInteractor.showActivityIndicator
                        .pipe(take(1))
                        .subscribe(
                            show => (didShowActivityIndicator = show),
                            e => reject(e),
                            () => resolveAfterAll()
                        );
                    signOutInteractor.showActivityIndicator
                        .pipe(skip(1), take(1))
                        .subscribe(
                            show => (didHideActivityIndicator = !show),
                            e => reject(e),
                            () => resolveAfterAll()
                        );
                    signOutInteractor.showSignIn.pipe(take(1)).subscribe(
                        () => (didShowSignIn = true),
                        e => reject(e),
                        () => resolveAfterAll()
                    );
                    signOutInteractor
                        .signOut()
                        .then(resolveAfterAll)
                        .catch(reject);
                });
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show activity indicator", async (): Promise<void> => {
            expect(didShowActivityIndicator).toBe(true);
        });

        // Then
        //
        it("should end session", (): void => {
            expect(sessionServiceMock.end).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should hide activity indicator", (): void => {
            expect(didHideActivityIndicator).toBe(true);
        });

        // Then
        //
        it("should show sign in", (): void => {
            expect(didShowSignIn).toBe(true);
        });
    });
});
