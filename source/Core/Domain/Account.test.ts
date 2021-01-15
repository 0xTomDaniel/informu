import Account, { AccountData, AccountNumber, AccountJson } from "./Account";
import { BeaconId } from "./ProvisionedMuTag";

const accountData: AccountData = {
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _muTags: new Set(["UUID00"]),
    _name: "Bill Stevens",
    _nextBeaconId: BeaconId.create("A"),
    _nextMuTagNumber: 10,
    _nextSafeZoneNumber: 4,
    _onboarding: false,
    _recycledBeaconIds: new Set([BeaconId.create("8"), BeaconId.create("9")]),
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632"
};
const referenceAccount = new Account(accountData);
const accountJson: AccountJson = {
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _muTags: [...accountData._muTags],
    _name: accountData._name,
    _nextBeaconId: accountData._nextBeaconId.toString(),
    _nextMuTagNumber: accountData._nextMuTagNumber,
    _nextSafeZoneNumber: accountData._nextSafeZoneNumber,
    _onboarding: accountData._onboarding,
    _recycledBeaconIds: [
        ...accountData._recycledBeaconIds
    ].map((beaconId): string => beaconId.toString()),
    _uid: accountData._uid
};

test("successfully creates Account from MuTagJSON", (): void => {
    const account = Account.deserialize(accountJson);
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
    _accountNumber: AccountNumber.fromString("0000000"),
    _emailAddress: "support+test@informu.io",
    _muTags: new Set(),
    _name: "Bill Stevens",
    _nextBeaconId: BeaconId.create("A"),
    _nextMuTagNumber: 10,
    _nextSafeZoneNumber: 4,
    _onboarding: false,
    _recycledBeaconIds: new Set(),
    _uid: "AZeloSR9jCOUxOWnf5RYN14r2632"
};
const referenceAccountEmptyCollections = new Account(
    accountDataEmptyCollections
);
const accountJsonEmptyCollections: AccountJson = {
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _name: accountData._name,
    _nextBeaconId: accountData._nextBeaconId.toString(),
    _nextMuTagNumber: accountData._nextMuTagNumber,
    _nextSafeZoneNumber: accountData._nextSafeZoneNumber,
    _onboarding: accountData._onboarding,
    _uid: accountData._uid
};

test("successfully creates Account from MuTagJSON (empty collections)", (): void => {
    const account = Account.deserialize(accountJsonEmptyCollections);
    expect(account).toEqual(referenceAccountEmptyCollections);
});

test("successfully serializes and deserializes Account (empty collections)", (): void => {
    const json = referenceAccountEmptyCollections.serialize();
    const account = Account.deserialize(json);
    expect(account).toEqual(referenceAccountEmptyCollections);
});

describe("session management", (): void => {
    const thisSessionId = "3179b6fe-1b95-4852-bff6-db3c125049dd";
    const otherSessionId = "5179b6fe-1b95-4852-bff6-db3c125049df";

    afterAll((): void => {
        jest.clearAllMocks();
    });

    test("successfully shows that there is not an active session", (): void => {
        expect(referenceAccount.hasActiveSession()).toBe(false);
    });

    test("successfully adds session", (): void => {
        referenceAccount.setSession(thisSessionId);
        expect(referenceAccount.isCurrentSession(thisSessionId)).toBe(true);
    });

    test("successfully shows that there is an active session", (): void => {
        expect(referenceAccount.hasActiveSession()).toBe(true);
    });

    test("successfully removes session", (): void => {
        referenceAccount.clearSession();
        expect(referenceAccount.isCurrentSession(thisSessionId)).toBe(false);
        expect(referenceAccount.isCurrentSession(otherSessionId)).toBe(false);
    });
});

describe("adding and removing MuTags", (): void => {
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

    test("successfully adds MuTag to account", (): void => {
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

    test("successfully adds another MuTag to account", (): void => {
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

    test("successfully removes two MuTags from account", (): void => {
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
