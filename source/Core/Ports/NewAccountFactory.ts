import Account from "../Domain/Account";

export interface NewAccountFactory {
    create(uid: string, emailAddress: string): Promise<Account>;
}
