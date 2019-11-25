import Account, { AccountData, AccountNumber, AccountJSON } from './Account';
import { BeaconID } from './ProvisionedMuTag';

const accountData: AccountData = {
    _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
    _accountNumber: AccountNumber.create('0000000'),
    _emailAddress: 'support+test@informu.io',
    _nextBeaconID: BeaconID.create('A'),
    _recycledBeaconIDs: new Set([BeaconID.create('8'), BeaconID.create('9')]),
    _nextMuTagNumber: 10,
    _muTags: new Set(['randomUUID#1']),
};
const referenceAccount = new Account(accountData);
const accountJSON: AccountJSON = {
    _uid: accountData._uid,
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _nextBeaconID: accountData._nextBeaconID.toString(),
    _recycledBeaconIDs: [...accountData._recycledBeaconIDs].map((beaconID): string => beaconID.toString()),
    _nextMuTagNumber: accountData._nextMuTagNumber,
    _muTags: [...accountData._muTags],
};

test('successfully creates Account from MuTagJSON', (): void => {
    const account = Account.deserialize(accountJSON);
    expect(account).toEqual(referenceAccount);
});

test('successfully serializes and deserializes Account', (): void => {
    // This is to ensure JSON.stringify doesn't throw error 'TypeError: Converting
    // circular structure to JSON'
    const subscription = referenceAccount.muTagsChange.subscribe((muTagsChange): void => {
        console.log(muTagsChange);
    });

    const json = referenceAccount.serialize();
    const account = Account.deserialize(json);

    // Unsubscribing ensures equality
    subscription.unsubscribe();
    expect(account).toEqual(referenceAccount);
});

const accountDataEmptyCollections: AccountData = {
    _uid: 'AZeloSR9jCOUxOWnf5RYN14r2632',
    _accountNumber: AccountNumber.create('0000000'),
    _emailAddress: 'support+test@informu.io',
    _nextBeaconID: BeaconID.create('A'),
    _recycledBeaconIDs: new Set(),
    _nextMuTagNumber: 10,
    _muTags: new Set(),
};
const referenceAccountEmptyCollections = new Account(accountDataEmptyCollections);
const accountJSONEmptyCollections: AccountJSON = {
    _uid: accountData._uid,
    _accountNumber: accountData._accountNumber.toString(),
    _emailAddress: accountData._emailAddress,
    _nextBeaconID: accountData._nextBeaconID.toString(),
    _nextMuTagNumber: accountData._nextMuTagNumber,
};

test('successfully creates Account from MuTagJSON (empty collections)', (): void => {
    const account = Account.deserialize(accountJSONEmptyCollections);
    expect(account).toEqual(referenceAccountEmptyCollections);
});

test('successfully serializes and deserializes Account (empty collections)', (): void => {
    const json = referenceAccountEmptyCollections.serialize();
    const account = Account.deserialize(json);
    expect(account).toEqual(referenceAccountEmptyCollections);
});
