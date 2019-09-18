import Percent from './Percent';

export enum MuTagColor {
    Charcoal,
    Cloud,
    Indiegogo,
    Kickstarter,
    MuOrange,
    Scarlet,
    Sky,
    Smoke,
}

export default class MuTag {

    protected readonly uid: string;
    protected batteryLevel: Percent;
    protected color: MuTagColor = MuTagColor.MuOrange;

    constructor(
        uid: string,
        batteryLevel: Percent,
    ) {
        this.uid = uid;
        this.batteryLevel = batteryLevel;
    }

    getUID(): string {
        return this.uid;
    }

    updateColor(color: MuTagColor): void {
        this.color = color;
    }
}
