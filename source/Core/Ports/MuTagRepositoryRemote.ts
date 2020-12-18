import ProvisionedMuTag from "../Domain/ProvisionedMuTag";
import { AccountNumber } from "../Domain/Account";
import { Millisecond } from "../../../source (restructure)/shared/metaLanguage/Types";

export enum MuTagRepoRemoteErrorType {
    DoesNotExist,
    FailedToAdd,
    FailedToGet,
    FailedToRemove,
    FailedToUpdate,
    PersistedDataMalformed
}

export class MuTagRepoRemoteError extends Error {
    readonly originatingError: any;
    readonly type: MuTagRepoRemoteErrorType;

    constructor(
        type: MuTagRepoRemoteErrorType,
        message: string,
        originatingError?: unknown
    ) {
        super(message);
        this.name = MuTagRepoRemoteErrorType[type];
        this.originatingError = originatingError;
        this.type = type;
    }

    static get DoesNotExist(): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.DoesNotExist,
            "Mu tag entity does not exist in remote persistence."
        );
    }

    static get FailedToAdd(): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.FailedToAdd,
            "Failed to add Mu tag entity to remote persistence."
        );
    }

    static get FailedToGet(): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.FailedToGet,
            "Failed to get Mu tag entity from remote persistence."
        );
    }

    static get FailedToRemove(): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.FailedToRemove,
            "Failed to remove Mu tag entity from remote persistence."
        );
    }

    static get FailedToUpdate(): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.FailedToUpdate,
            "Failed to update Mu tag entity to remote persistence."
        );
    }

    static PersistedDataMalformed(json: string): MuTagRepoRemoteError {
        return new MuTagRepoRemoteError(
            MuTagRepoRemoteErrorType.PersistedDataMalformed,
            `Received malformed data from remote persistence:\n${json}`
        );
    }
}

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
