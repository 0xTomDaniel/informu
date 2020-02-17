import Account, { AccountData, AccountNumber, AccountJSON } from "./Account";
import { BeaconId } from "./ProvisionedMuTag";

const accountData: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _nextBeaconId: BeaconId.create("A"),
    _recycledBeaconIds: new Set([BeaconId.create("8"), BeaconId.create("9")]),
    _nextMuTagNumber: 10,
    _muTags: new Set(["UUID00"])
};
const referenceAccount = new Account(accountData);
const accountJSON: AccountJSON = {
    _uid: accountData._uid,
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _nextBeaconId: accountData._nextBeaconId.toString(),
    _recycledBeaconIds: [
        ...accountData._recycledBeaconIds
    ].map((beaconId): string => beaconId.toString()),
    _nextMuTagNumber: accountData._nextMuTagNumber,
    _muTags: [...accountData._muTags]
};

test("successfully creates Account from MuTagJSON", (): void => {
    const account = Account.deserialize(accountJSON);
    expect(account).toEqual(referenceAccount);
});

test("successfully serializes and deserializes Account", (): void => {
    // This is to ensure JSON.stringify doesn't throw error 'TypeError: Converting
    // circular structure to JSON'
    const subscription = referenceAccount.muTagsChange.subscribe(
        (muTagsChange): void => {
            console.log(muTagsChange);
        }
    );

    const json = referenceAccount.serialize();
    const account = Account.deserialize(json);

    // Unsubscribing ensures equality
    subscription.unsubscribe();
    expect(account).toEqual(referenceAccount);
});

const accountDataEmptyCollections: AccountData = {
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _nextBeaconId: BeaconId.create("A"),
    _recycledBeaconIds: new Set(),
    _nextMuTagNumber: 10,
    _muTags: new Set()
};
const referenceAccountEmptyCollections = new Account(
    accountDataEmptyCollections
);
const accountJSONEmptyCollections: AccountJSON = {
    _uid: accountData._uid,
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _nextBeaconId: accountData._nextBeaconId.toString(),
    _nextMuTagNumber: accountData._nextMuTagNumber
};

test("successfully creates Account from MuTagJSON (empty collections)", (): void => {
    const account = Account.deserialize(accountJSONEmptyCollections);
    expect(account).toEqual(referenceAccountEmptyCollections);
});

test("successfully serializes and deserializes Account (empty collections)", (): void => {
    const json = referenceAccountEmptyCollections.serialize();
    const account = Account.deserialize(json);
    expect(account).toEqual(referenceAccountEmptyCollections);
});

describe("adding and removing Mu tags", (): void => {
    const beaconIdOne = referenceAccount.newBeaconId;
    const muTagUIDOne = "UUID01";
    const muTagUIDTwo = "UUID02";

    /*beforeAll(async (): Promise<void> => {
        account.removeMuTag(addedMuTagData._uid, addedMuTagData._beaconId);
        await new Promise(setImmediate);
    });

    afterAll((): void => {
        jest.clearAllMocks();
    });*/

    test("successfully adds Mu tag to account", (): void => {
        expect.assertions(3);
        const subscription = referenceAccount.muTagsChange.subscribe(
            (muTagsChange): void => {
                expect(muTagsChange.insertion).toEqual(muTagUIDOne);
                expect(muTagsChange.deletion).toEqual(undefined);
            }
        );
        referenceAccount.addNewMuTag(muTagUIDOne, beaconIdOne);
        expect(referenceAccount.newMuTagNumber).toEqual(11);

        subscription.unsubscribe();
    });

    test("successfully adds another Mu tag to account", (): void => {
        const beaconIdTwo = referenceAccount.newBeaconId;

        expect.assertions(3);
        const subscription = referenceAccount.muTagsChange.subscribe(
            (muTagsChange): void => {
                expect(muTagsChange.insertion).toEqual(muTagUIDTwo);
                expect(muTagsChange.deletion).toEqual(undefined);
            }
        );
        referenceAccount.addNewMuTag(muTagUIDTwo, beaconIdTwo);
        expect(referenceAccount.newMuTagNumber).toEqual(12);

        subscription.unsubscribe();
    });

    test("successfully removes two Mu tags from account", (): void => {
        expect.assertions(3);
        const subscription = referenceAccount.muTagsChange.subscribe(
            (muTagsChange): void => {
                expect(muTagsChange.deletion).toEqual(muTagUIDOne);
                expect(muTagsChange.insertion).toEqual(undefined);
            }
        );
        referenceAccount.removeMuTag(muTagUIDOne, beaconIdOne);
        expect(referenceAccount.newBeaconId.toString()).toEqual("8");

        subscription.unsubscribe();
    });
});
