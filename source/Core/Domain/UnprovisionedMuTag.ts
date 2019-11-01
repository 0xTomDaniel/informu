import MuTag from './MuTag';
import Percent from './Percent';

export default class UnprovisionedMuTag extends MuTag {

    protected readonly _uid: string;
    protected readonly _batteryLevel: Percent;

    constructor(uid: string, batteryLevel: Percent) {
        super();
        this._uid = uid;
        this._batteryLevel = batteryLevel;
    }

    get batteryLevel(): Percent {
        return this._batteryLevel;
    }

    isBatteryAboveThreshold(threshold: Percent): boolean {
        return this._batteryLevel > threshold;
    }
}
