import UnprovisionedMuTag from '../Domain/UnprovisionedMuTag';
import ProvisionedMuTag from '../Domain/ProvisionedMuTag';
import { RSSI } from '../Domain/Types';
import { BeaconID } from '../Domain/ProvisionedMuTag';
import { AccountNumber } from '../Domain/Account';

export class UnprovisionMuTagDeviceNotFound extends Error {

    constructor() {
        super('Could not find new Mu tag. Please scan for new Mu tag again.');
        this.name = 'UnprovisionMuTagDeviceNotFound';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BluetoothUnsupported extends Error {

    constructor() {
        super('This device doesn\'t support Bluetooth. Mu tags cannot be added.');
        this.name = 'BluetoothUnsupported';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NewMuTagNotFound extends Error {

    constructor() {
        super('Could not find new Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app.');
        this.name = 'NewMuTagNotFound';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ProvisionMuTagFailed extends Error {

    constructor() {
        super('Failed to add Mu tag. Please ensure the Mu tag light is flashing and move it closer to the app.');
        this.name = 'ProvisionMuTagFailed';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagAlreadyRunning extends Error {

    constructor() {
        super('Already searching for new Mu tag.');
        this.name = 'FindNewMuTagAlreadyRunning';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class FindNewMuTagCanceled extends Error {

    constructor() {
        super('Find new Mu tag was canceled.');
        this.name = 'FindNewMuTagCanceled';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface MuTagDevices {

    findNewMuTag(scanThreshold: RSSI): Promise<UnprovisionedMuTag>;
    cancelFindNewMuTag(): void;
    provisionMuTag(
        unprovisionedMuTag: UnprovisionedMuTag,
        accountNumber: AccountNumber,
        beaconID: BeaconID,
        muTagNumber: number,
        muTagName: string,
    ): Promise<ProvisionedMuTag>;
}
