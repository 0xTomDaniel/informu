import AccountRepositoryRemote from "../Ports/AccountRepositoryRemote";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import { NewAccountFactory } from "../Ports/NewAccountFactory";

export interface AccountRegistration {
    register(uid: string, emailAddress: string, name: string): Promise<void>;
}

export default class AccountRegistrationService implements AccountRegistration {
    private readonly newAccountFactory: NewAccountFactory;
    private readonly accountRepoRemote: AccountRepositoryRemote;
    private readonly accountRepoLocal: AccountRepositoryLocal;

    constructor(
        newAccountFactory: NewAccountFactory,
        accountRepoRemote: AccountRepositoryRemote,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.newAccountFactory = newAccountFactory;
        this.accountRepoRemote = accountRepoRemote;
        this.accountRepoLocal = accountRepoLocal;
    }

    async register(
        uid: string,
        emailAddress: string,
        name: string
    ): Promise<void> {
        const account = await this.newAccountFactory.create(
            uid,
            emailAddress,
            name
        );
        await this.accountRepoRemote.add(account);
        await this.accountRepoLocal.add(account);
    }
}
