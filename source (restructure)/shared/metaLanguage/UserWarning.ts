export default abstract class UserWarning {
    originatingError?: Error;
    abstract name: string;
    abstract userWarningDescription: string;

    constructor(originatingError?: Error) {
        this.originatingError = originatingError;
    }
}
