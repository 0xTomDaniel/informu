export default abstract class UserError {
    originatingError?: any;
    abstract name: string;
    abstract userErrorDescription: string;

    constructor(originatingError?: any) {
        this.originatingError = originatingError;
    }
}
