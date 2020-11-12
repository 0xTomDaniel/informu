import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { Observable } from "rxjs";
import Percent from "../../shared/metaLanguage/Percent";
import { Connection } from "../../shared/muTagDevices/MuTagDevices";

export default interface MuTagDevicesPort {
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<Connection>;
    disconnectFromMuTag(connection: Connection): void;
    readBatteryLevel(connection: Connection): Promise<Percent>;
}
