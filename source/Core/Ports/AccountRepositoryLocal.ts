import Account from "../Domain/Account";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

export interface AccountRepositoryLocal {
    get(): Promise<Account>;
    add(account: Account): Promise<void>;
    update(account: Account): Promise<void>;
    remove(): Promise<void>;
}

type ExceptionType =
    | {
          type: "DoesNotExist";
          data: [];
      }
    | {
          type: "FailedToAdd";
          data: [];
      }
    | {
          type: "FailedToGet";
          data: [];
      }
    | {
          type: "FailedToRemove";
          data: [];
      }
    | {
          type: "FailedToUpdate";
          data: [];
      };

export class AccountRepositoryLocalException extends Exception<ExceptionType> {
    static get DoesNotExist(): AccountRepositoryLocalException {
        return new this(
            { type: "DoesNotExist", data: [] },
            "Account entity does not exist in local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToAdd(): AccountRepositoryLocalException {
        return new this(
            { type: "FailedToAdd", data: [] },
            "Failed to add account entity to local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToGet(): AccountRepositoryLocalException {
        return new this(
            { type: "FailedToGet", data: [] },
            "Failed to get account entity from local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToRemove(): AccountRepositoryLocalException {
        return new this(
            { type: "FailedToRemove", data: [] },
            "Failed to remove account entity from local persistence.",
            "error",
            undefined,
            true
        );
    }

    static get FailedToUpdate(): AccountRepositoryLocalException {
        return new this(
            { type: "FailedToUpdate", data: [] },
            "Failed to update account entity to local persistence.",
            "error",
            undefined,
            true
        );
    }
}
