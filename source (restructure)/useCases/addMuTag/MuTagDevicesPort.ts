import UnprovisionedMuTag from "../../../source/Core/Domain/UnprovisionedMuTag";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import { RSSI } from "../../../source/Core/Domain/Types";
import { BeaconID } from "../../../source/Core/Domain/ProvisionedMuTag";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import Percent from "../../../source/Core/Domain/Percent";

export class UnprovisionMuTagDeviceNotFound extends Error {
    constructor() {
        super("Could not find new Mu tag. Please scan for new Mu tag again.");
        this.name = "UnprovisionMuTagDeviceNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BluetoothUnsupported extends Error {
    constructor() {
        super(
            "This device doesn't support Bluetooth. Mu tags cannot be added."
        );
        this.name = "BluetoothUnsupported";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BluetoothPoweredOff extends Error {
    constructor() {
        super("Bluetooth is powered off. Please turn it on and try again.");
        this.name = "BluetoothPoweredOff";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NewMuTagNotFound extends Error {
    constructor() {
        super(
            "Could not find new Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app."
        );
        this.name = "NewMuTagNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ProvisionMuTagFailed extends Error {
    constructor() {
        super(
            "Failed to add Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app."
        );
        this.name = "ProvisionMuTagFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class UnprovisionMuTagFailed extends Error {
    constructor() {
        super(
            "Failed to remove Mu tag. Please ensure the Mu tag is charged and move it closer to the app."
        );
        this.name = "UnprovisionMuTagFailed";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagAlreadyRunning extends Error {
    constructor() {
        super("Already searching for new Mu tag.");
        this.name = "FindNewMuTagAlreadyRunning";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagCanceled extends Error {
    constructor() {
        super("Find new Mu tag was canceled.");
        this.name = "FindNewMuTagCanceled";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MuTagNotFound extends Error {
    constructor() {
        super(
            "Could not find Mu tag. Please ensure the Mu tag is charged and move it closer to the app."
        );
        this.name = "MuTagNotFound";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class InvalidProvisioning extends Error {
    constructor() {
        super(
            "Mu tag provisioning is invalid. Please contact customer support."
        );
        this.name = "InvalidProvisioning";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export enum TXPowerSetting {
    "+6 dBm",
    "0 dBm",
    "-8 dBm",
    "-15 dBm",
    "-20 dBm"
}

export interface MuTagDevicesPort {
    findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    cancelFindNewMuTag(): void;
    connectToProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;
    disconnectFromProvisionedMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): void;
    provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: AccountNumber,
        beaconID: BeaconID,
        muTagNumber: number,
        muTagName: string
    ): Promise<ProvisionedMuTag>;
    unprovisionMuTag(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;
    readBatteryLevel(
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<Percent>;
    changeTXPower(
        txPower: TXPowerSetting,
        accountNumber: AccountNumber,
        beaconID: BeaconID
    ): Promise<void>;
}
