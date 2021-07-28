import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export interface RepositoryLocal {
    erase(): Promise<void>;
}

const ExceptionType = ["FailedToErase"] as const;
export type ExceptionType = typeof ExceptionType[number];

export class RepositoryLocalException<
    T extends ExceptionType
> extends Exception<T> {
    static FailedToErase(
        sourceException: unknown
    ): RepositoryLocalException<"FailedToErase"> {
        return new this(
            "FailedToErase",
            "Failed to erase local persistence.",
            "error",
            sourceException,
            true
        );
    }
}
