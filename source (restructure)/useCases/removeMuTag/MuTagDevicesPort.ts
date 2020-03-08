import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import Percent from "../../shared/metaLanguage/Percent";
import { Observable } from "rxjs";

export default interface MuTagDevicesPort {
    unprovisionMuTag(
        accountNumber: Hexadecimal,
        beaconId: Hexadecimal
    ): Promise<void>;
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
