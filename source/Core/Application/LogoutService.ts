import { LogoutOutput } from "../Ports/LogoutOutput";
import { Session } from "./SessionService";

export default class LogoutService {
    private readonly logoutOutput: LogoutOutput;
    private readonly sessionService: Session;

    constructor(logoutOutput: LogoutOutput, sessionService: Session) {
        this.logoutOutput = logoutOutput;
        this.sessionService = sessionService;
    }

    async logOut(): Promise<void> {
        this.logoutOutput.showBusyIndicator();
        await this.sessionService.end();
        this.logoutOutput.showLogoutComplete();
    }
}
