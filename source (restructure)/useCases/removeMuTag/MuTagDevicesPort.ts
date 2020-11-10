import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import { Observable } from "rxjs";
import { ConnectionId } from "../../shared/muTagDevices/MuTagDevices";

export default interface MuTagDevicesPort {
    unprovisionMuTag(connectionId: ConnectionId): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<ConnectionId>;
    disconnectFromProvisionedMuTag(connectionId: ConnectionId): void;
    readBatteryLevel(connectionId: ConnectionId): Promise<Percent>;
}
