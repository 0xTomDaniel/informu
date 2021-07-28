import ProvisionedMuTag, { BeaconId } from "../Domain/ProvisionedMuTag";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export default interface MuTagRepositoryLocal {
    getByUid(uid: string): Promise<ProvisionedMuTag>;
    getByBeaconId(beaconId: BeaconId): Promise<ProvisionedMuTag>;
    getAll(): Promise<Set<ProvisionedMuTag>>;
    add(muTag: ProvisionedMuTag): Promise<void>;
    addMultiple(muTags: Set<ProvisionedMuTag>): Promise<void>;
    update(muTag: ProvisionedMuTag): Promise<void>;
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
export type ExceptionType = typeof ExceptionType[number];

export class MuTagRepositoryLocalException<
    T extends ExceptionType
> extends Exception<T> {
    static DoesNotExist(
        mutagUid: string
    ): MuTagRepositoryLocalException<"DoesNotExist"> {
        return new this(
            "DoesNotExist",
            `MuTag entity (${mutagUid}) does not exist in local persistence.`,
            "error",
            undefined,
            true
        );
    }

    static FailedToAdd(
        sourceException: unknown
    ): MuTagRepositoryLocalException<"FailedToAdd"> {
        return new this(
            "FailedToAdd",
            "Failed to add MuTag entity to local persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToGet(
        sourceException: unknown
    ): MuTagRepositoryLocalException<"FailedToGet"> {
        return new this(
            "FailedToGet",
            "Failed to get MuTag entity from local persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToRemove(
        sourceException: unknown
    ): MuTagRepositoryLocalException<"FailedToRemove"> {
        return new this(
            "FailedToRemove",
            "Failed to remove MuTag entity from local persistence.",
            "error",
            sourceException,
            true
        );
    }

    static FailedToUpdate(
        sourceException: unknown
    ): MuTagRepositoryLocalException<"FailedToUpdate"> {
        return new this(
            "FailedToUpdate",
            "Failed to update MuTag entity to local persistence.",
            "error",
            sourceException,
            true
        );
    }

    static PersistedDataMalformed(
        json: string,
        sourceException: unknown
    ): MuTagRepositoryLocalException<"PersistedDataMalformed"> {
        return new this(
            "PersistedDataMalformed",
            `Received malformed data from local persistence:\n${json}`,
            "error",
            sourceException,
            true
        );
    }
}
