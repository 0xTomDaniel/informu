import MuTag from './MuTag';
import Percent from './Percent';

export default class UnprovisionedMuTag extends MuTag {

    protected readonly uid: string;
    protected readonly batteryLevel: Percent;

    constructor(uid: string, batteryLevel: Percent) {
        super();
        this.uid = uid;
        this.batteryLevel = batteryLevel;
    }

    getBatteryLevel(): Percent {
        return this.batteryLevel;
    }

    isBatteryAbove(threshold: Percent): boolean {
        return this.batteryLevel > threshold;
    }
}
