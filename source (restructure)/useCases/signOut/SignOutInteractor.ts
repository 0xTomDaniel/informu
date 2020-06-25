import { SignOutOutput } from "./SignOutOutput";
import { Session } from "../../../source/Core/Application/SessionService";

export default class SignOutInteractor {
    private readonly logoutOutput: SignOutOutput;
    private readonly sessionService: Session;

    constructor(logoutOutput: SignOutOutput, sessionService: Session) {
        this.logoutOutput = logoutOutput;
        this.sessionService = sessionService;
    }

    async logOut(): Promise<void> {
        this.logoutOutput.showBusyIndicator();
        await this.sessionService.end();
        this.logoutOutput.showLogoutComplete();
    }
}
