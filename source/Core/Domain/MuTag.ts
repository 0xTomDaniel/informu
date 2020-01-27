import Percent from "../../../source (restructure)/shared/metaLanguage/Percent";

export enum MuTagColor {
    Charcoal,
    Cloud,
    Indiegogo,
    Kickstarter,
    MuOrange,
    Scarlet,
    Sky,
    Smoke
}

export default abstract class MuTag {
    protected abstract readonly _uid: string;
    protected abstract _batteryLevel: Percent;

    get uid(): string {
        return this._uid;
    }
}
