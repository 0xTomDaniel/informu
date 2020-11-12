import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import { Observable } from "rxjs";
import { Connection } from "../../shared/muTagDevices/MuTagDevices";

export default interface MuTagDevicesPort {
    unprovisionMuTag(connection: Connection): Promise<void>;
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<Connection>;
    disconnectFromMuTag(connection: Connection): void;
    readBatteryLevel(connection: Connection): Promise<Percent>;
}
