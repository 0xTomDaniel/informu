import Percent from './Percent';

export default class MuTag {

    uid: string;
    batteryLevel: Percent;

    constructor(
        uid: string,
        batteryLevel: Percent,
    ) {
        this.uid = uid;
        this.batteryLevel = batteryLevel;
    }
}
