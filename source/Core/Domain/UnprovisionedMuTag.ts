import MuTag from './MuTag';
import Percent from './Percent';

export default class UnprovisionedMuTag extends MuTag {

    isBatteryAbove(threshold: Percent): boolean {
        return this.batteryLevel > threshold;
    }
}
