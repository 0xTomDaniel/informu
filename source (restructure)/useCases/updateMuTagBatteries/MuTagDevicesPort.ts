import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { Observable } from "rxjs";
import Percent from "../../shared/metaLanguage/Percent";
import { ConnectionId } from "../../shared/muTagDevices/MuTagDevices";

export default interface MuTagDevicesPort {
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<ConnectionId>;
    disconnectFromProvisionedMuTag(connectionId: ConnectionId): void;
    readBatteryLevel(connectionId: ConnectionId): Promise<Percent>;
}
