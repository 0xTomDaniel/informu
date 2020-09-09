import UserError, { UserErrorType } from "./UserError";

export interface UserErrorViewData {
    errorMessage: string;
    errorDetails?: string;
}

export default abstract class ViewModel {
    protected abstract getUserErrorMessage(
        error: UserError<UserErrorType>
    ): string;

    protected getUserErrorViewData(
        errorMessage: string,
        originatingError?: unknown
    ): UserErrorViewData {
        const viewData: UserErrorViewData = {
            errorMessage: errorMessage
        };
        if (originatingError != null) {
            viewData.errorDetails = JSON.stringify(
                originatingError,
                Object.getOwnPropertyNames(originatingError)
            );
        }
        return viewData;
    }
}
