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

export default abstract class MuTag {

    protected abstract readonly uid: string;
    protected abstract batteryLevel: Percent;

    getUID(): string {
        return this.uid;
    }
}
