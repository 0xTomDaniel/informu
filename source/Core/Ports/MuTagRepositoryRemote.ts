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
        originatingException: unknown
    ): MuTagRepoRemoteException<"DoesNotExist"> {
        return new this(
            "DoesNotExist",
            "Mu tag entity does not exist in remote persistence.",
            "error",
            originatingException,
            true
        );
    }

    static FailedToAdd(
        originatingException: unknown
    ): MuTagRepoRemoteException<"FailedToAdd"> {
        return new this(
            "FailedToAdd",
            "Failed to add Mu tag entity to remote persistence.",
            "error",
            originatingException,
            true
        );
    }

    static FailedToGet(
        originatingException: unknown
    ): MuTagRepoRemoteException<"FailedToGet"> {
        return new this(
            "FailedToGet",
            "Failed to get Mu tag entity from remote persistence.",
            "error",
            originatingException,
            true
        );
    }

    static FailedToRemove(
        originatingException: unknown
    ): MuTagRepoRemoteException<"FailedToRemove"> {
        return new this(
            "FailedToRemove",
            "Failed to remove Mu tag entity from remote persistence.",
            "error",
            originatingException,
            true
        );
    }

    static FailedToUpdate(
        originatingException: unknown
    ): MuTagRepoRemoteException<"FailedToUpdate"> {
        return new this(
            "FailedToUpdate",
            "Failed to update Mu tag entity to remote persistence.",
            "error",
            originatingException,
            true
        );
    }

    static PersistedDataMalformed(
        json: string,
        originatingException?: unknown
    ): MuTagRepoRemoteException<"PersistedDataMalformed"> {
        return new this(
            "PersistedDataMalformed",
            `Received malformed data from remote persistence:\n${json}`,
            "error",
            originatingException,
            true
        );
    }
}
