import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { NewAccountFactory } from "../Ports/NewAccountFactory";

export interface AccountRegistration {
    registerFederated(uid: string, emailAddress: string): Promise<void>;
}

export default class AccountRegistrationService implements AccountRegistration {
    private readonly newAccountFactory: NewAccountFactory;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        accountFactory: NewAccountFactory,
        accountRepoRemote: AccountRepositoryRemote,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.newAccountFactory = accountFactory;
        this.accountRepoRemote = accountRepoRemote;
        this.accountRepoLocal = accountRepoLocal;
    }

    async registerFederated(uid: string, emailAddress: string): Promise<void> {
        const account = await this.newAccountFactory.create(uid, emailAddress);
        await this.accountRepoRemote.add(account);
        await this.accountRepoLocal.add(account);
    }
}
