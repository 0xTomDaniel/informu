export default abstract class UserError extends Error {
    originatingError?: Error;
    abstract name: string;

    constructor(userErrorDescription: string, originatingError?: Error) {
        super(userErrorDescription);
        this.originatingError = originatingError;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
