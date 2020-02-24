export default abstract class UserError {
    originatingError?: Error;
    abstract name: string;
    abstract userErrorDescription: string;

    constructor(originatingError?: Error) {
        this.originatingError = originatingError;
    }
}
