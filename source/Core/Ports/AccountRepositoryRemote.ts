import Account from "../Domain/Account";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export default interface AccountRepositoryRemote {
    getByUid(uid: string): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    removeByUid(uid: string): Promise<void>;
}

const ExceptionType = [
    "DoesNotExist",
    "FailedToAdd",
    "FailedToGet",
    "FailedToRemove",
    "FailedToUpdate",
    "PersistedDataMalformed"
] as const;
type ExceptionType = typeof ExceptionType[number];

export class AccountRepositoryRemoteException<
    T extends ExceptionType
> extends Exception<T> {
    static get DoesNotExist(): AccountRepositoryRemoteException<
        "DoesNotExist"
    > {
        return new this(
            "DoesNotExist",
            "Account entity does not exist in remote persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToAdd(): AccountRepositoryRemoteException<"FailedToAdd"> {
        return new this(
            "FailedToAdd",
            "Failed to add account entity to remote persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToGet(): AccountRepositoryRemoteException<"FailedToGet"> {
        return new this(
            "FailedToGet",
            "Failed to get account entity from remote persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToRemove(): AccountRepositoryRemoteException<
        "FailedToRemove"
    > {
        return new this(
            "FailedToRemove",
            "Failed to remove account entity from remote persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToUpdate(): AccountRepositoryRemoteException<
        "FailedToUpdate"
    > {
        return new this(
            "FailedToUpdate",
            "Failed to update account entity to remote persistence.",
            "error",
            undefined,
            true
        );
    }

    static PersistedDataMalformed(
        json: string,
        orginatingException?: unknown
    ): AccountRepositoryRemoteException<"PersistedDataMalformed"> {
        return new this(
            "PersistedDataMalformed",
            `Received malformed data from remote persistence:\n${json}`,
            "error",
            orginatingException,
            true
        );
    }
}
