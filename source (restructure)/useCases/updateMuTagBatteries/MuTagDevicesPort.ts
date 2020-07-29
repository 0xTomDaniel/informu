import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { Observable } from "rxjs";
import Percent from "../../shared/metaLanguage/Percent";

export default interface MuTagDevicesPort {
    connectToProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Observable<void>;
    disconnectFromProvisionedMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): void;
    readBatteryLevel(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<Percent>;
}
