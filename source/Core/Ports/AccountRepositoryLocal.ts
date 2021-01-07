import Account from "../Domain/Account";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export interface AccountRepositoryLocal {
    get(): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    remove(): Promise<void>;
}

const ExceptionType = [
    "DoesNotExist",
    "FailedToAdd",
    "FailedToGet",
    "FailedToRemove",
    "FailedToUpdate"
] as const;
type ExceptionType = typeof ExceptionType[number];

export class AccountRepositoryLocalException<
    T extends ExceptionType
> extends Exception<T> {
    static get DoesNotExist(): AccountRepositoryLocalException<"DoesNotExist"> {
        return new this(
            "DoesNotExist",
            "Account entity does not exist in local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToAdd(): AccountRepositoryLocalException<"FailedToAdd"> {
        return new this(
            "FailedToAdd",
            "Failed to add account entity to local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToGet(): AccountRepositoryLocalException<"FailedToGet"> {
        return new this(
            "FailedToGet",
            "Failed to get account entity from local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToRemove(): AccountRepositoryLocalException<
        "FailedToRemove"
    > {
        return new this(
            "FailedToRemove",
            "Failed to remove account entity from local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToUpdate(): AccountRepositoryLocalException<
        "FailedToUpdate"
    > {
        return new this(
            "FailedToUpdate",
            "Failed to update account entity to local persistence.",
            "error",
            undefined,
            true
        );
    }
}
