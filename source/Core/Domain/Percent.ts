export class InvalidPercentage extends RangeError {

    constructor(value: number) {
        super(`${value} is an invalid percentage. Expected a number between 0-100.`);
        this.name = 'InvalidPercentValue';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default class Percent {

    private value: number;

    constructor(percent: number) {
        if (percent < 0 || percent > 100) {
            throw new InvalidPercentage(percent);
        } else {
            this.value = percent;
        }
    }

    valueOf(): number {
        return this.value;
    }
}
