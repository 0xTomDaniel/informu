import { AccountRepositoryRemote } from "../Ports/AccountRepositoryRemote";
import Account, { AccountNumber, AccountData } from "../Domain/Account";
import { AccountRepositoryLocal } from "../Ports/AccountRepositoryLocal";
import AccountRegistrationService from "./AccountRegistrationService";
import { NewAccountFactory } from "../Ports/NewAccountFactory";
import { BeaconId } from "../Domain/ProvisionedMuTag";

describe("user registers new account", (): void => {
    const AccountRepositoryRemoteMock = jest.fn<AccountRepositoryRemote, any>(
        (): AccountRepositoryRemote => ({
            getByUid: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            removeByUid: jest.fn()
        })
    );
    const accountRepoRemoteMock = new AccountRepositoryRemoteMock();
    const AccountRepositoryLocalMock = jest.fn<AccountRepositoryLocal, any>(
        (): AccountRepositoryLocal => ({
            get: jest.fn(),
            add: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        })
    );
    const accountRepoLocalMock = new AccountRepositoryLocalMock();
    const NewAccountFactoryMock = jest.fn<NewAccountFactory, any>(
        (): NewAccountFactory => ({
            create: jest.fn()
        })
    );
    const newAccountFactoryMock = new NewAccountFactoryMock();

    const accountRegistrationService = new AccountRegistrationService(
        newAccountFactoryMock,
        accountRepoRemoteMock,
        accountRepoLocalMock
    );

    const newUID = "AZeloSR9jCOUxOWnf5RYN14r2632";
    const newEmail = "support+test2@informu.io";
    const newAccountData: AccountData = {
        _uid: newUID,
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: newEmail,
        _nextBeaconId: BeaconId.create("0"),
        _recycledBeaconIds: new Set(),
        _nextMuTagNumber: 15,
        _muTags: new Set()
    };
    const newAccount = new Account(newAccountData);

    describe("account does not exist for federated authentication", (): void => {
        // Given that no account is logged in

        // Given that account does not exist for provided user

        (newAccountFactoryMock.create as jest.Mock).mockResolvedValueOnce(
            newAccount
        );

        // When user successfully authenticates with federated credentials
        //
        beforeAll(
            async (): Promise<void> => {
                await accountRegistrationService.registerFederated(
                    newUID,
                    newEmail
                );
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should create new account", (): void => {
            expect(newAccountFactoryMock.create).toHaveBeenCalledTimes(1);
            expect(newAccountFactoryMock.create).toHaveBeenCalledWith(
                newUID,
                newEmail
            );
        });

        // Then
        //
        it("should save new account to remote persistence", (): void => {
            expect(accountRepoRemoteMock.add).toHaveBeenCalledTimes(1);
            expect(accountRepoRemoteMock.add).toHaveBeenCalledWith(newAccount);
        });

        // Then
        //
        it("should save new account to local persistence", (): void => {
            expect(accountRepoLocalMock.add).toHaveBeenCalledTimes(1);
            expect(accountRepoLocalMock.add).toHaveBeenCalledWith(newAccount);
        });
    });
});
