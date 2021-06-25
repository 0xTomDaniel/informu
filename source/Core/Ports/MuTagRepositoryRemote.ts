import ProvisionedMuTag from "../Domain/ProvisionedMuTag";
import { AccountNumber } from "../Domain/Account";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export interface MuTagRepositoryRemote {
    getAll(accountUid: string): Promise<Set<ProvisionedMuTag>>;
    add(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    update(
        muTag: ProvisionedMuTag,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    updateMultiple(
        muTags: Set<ProvisionedMuTag>,
        accountUid: string,
        accountNumber: AccountNumber
    ): Promise<void>;
    removeByUid(uid: string, accountUid: string): Promise<void>;
}

const ExceptionType = [
    "DoesNotExist",
    "FailedToAdd",
    "FailedToGet",
    "FailedToRemove",
    "FailedToUpdate",
    "PersistedDataMalformed"
] as const;
export type ExceptionType = typeof ExceptionType[number];

export class MuTagRepoRemoteException<
    T extends ExceptionType
> extends Exception<T> {
    static DoesNotExist(
        sourceException: unknown
    ): MuTagRepoRemoteException<"DoesNotExist"> {
        return new this(
            "DoesNotExist",
            "MuTag entity does not exist in remote persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToAdd(
        sourceException: unknown
    ): MuTagRepoRemoteException<"FailedToAdd"> {
        return new this(
            "FailedToAdd",
            "Failed to add MuTag entity to remote persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToGet(
        sourceException: unknown
    ): MuTagRepoRemoteException<"FailedToGet"> {
        return new this(
            "FailedToGet",
            "Failed to get MuTag entity from remote persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToRemove(
        sourceException: unknown
    ): MuTagRepoRemoteException<"FailedToRemove"> {
        return new this(
            "FailedToRemove",
            "Failed to remove MuTag entity from remote persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToUpdate(
        sourceException: unknown
    ): MuTagRepoRemoteException<"FailedToUpdate"> {
        return new this(
            "FailedToUpdate",
            "Failed to update MuTag entity to remote persistence.",
            "error",
            sourceException,
            true
        );
    }

    static PersistedDataMalformed(
        json: string,
        sourceException?: unknown
    ): MuTagRepoRemoteException<"PersistedDataMalformed"> {
        return new this(
            "PersistedDataMalformed",
            `Received malformed data from remote persistence:\n${json}`,
            "error",
            sourceException,
            true
        );
    }
}
