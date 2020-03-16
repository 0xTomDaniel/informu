import Percent from "../../shared/metaLanguage/Percent";
import ProvisionedMuTag, {
    BeaconId
} from "../../../source/Core/Domain/ProvisionedMuTag";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagRepositoryRemotePort from "./MuTagRepositoryRemotePort";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import AccountRepositoryRemotePort from "./AccountRepositoryRemotePort";
import Account, {
    AccountData,
    AccountNumber
} from "../../../source/Core/Domain/Account";
import { MuTagColor } from "../../../source/Core/Domain/MuTag";
import RemoveMuTagInteractor, {
    LowMuTagBattery,
    FailedToConnectToMuTag
} from "./RemoveMuTagInteractor";
import { RemoveMuTagOutputPort } from "./RemoveMuTagOutputPort";
//import MuTagDevicesPort from "./MuTagDevicesPort";
import UserError from "../../shared/metaLanguage/UserError";
import EventTracker from "../../shared/metaLanguage/EventTracker";
import Logger from "../../shared/metaLanguage/Logger";
import Bluetooth, {
    Peripheral,
    PeripheralId,
    ManufacturerData
} from "../../shared/muTagDevices/Bluetooth";
import MuTagDevices from "../../shared/muTagDevices/MuTagDevices";
import { Subscriber, Observable } from "rxjs";
import Hexadecimal from "../../shared/metaLanguage/Hexadecimal";
import { Rssi } from "../../shared/metaLanguage/Types";
import { v4 as uuidV4 } from "uuid";
import { MuTagBLEGATT } from "../../shared/muTagDevices/MuTagBLEGATT/MuTagBLEGATT";

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

let discoveredPeripheralSubscriber: Subscriber<Peripheral>;
const discoveredPeripheralObservable = new Observable<Peripheral>(
    subscriber => {
        discoveredPeripheralSubscriber = subscriber;
    }
);
const BluetoothMock = jest.fn<Bluetooth, any>(
    (): Bluetooth => ({
        discoveredPeripheral: discoveredPeripheralObservable,
        startScan: jest.fn(),
        stopScan: jest.fn(),
        retrieveServices: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        read: jest.fn(),
        write: jest.fn(),
        enableBluetooth: jest.fn()
    })
);
const bluetoothMock = new BluetoothMock();
const muTagDevices = new MuTagDevices(bluetoothMock);

describe("Mu tag user removes Mu tag", (): void => {
    (bluetoothMock.retrieveServices as jest.Mock).mockResolvedValue({});
    (bluetoothMock.stopScan as jest.Mock).mockResolvedValue(undefined);
    const connections = new Map<PeripheralId, Subscriber<void>>();
    (bluetoothMock.connect as jest.Mock).mockImplementation(
        (peripheralId: PeripheralId) =>
            new Observable<void>(subscriber => {
                connections.set(peripheralId, subscriber);
                subscriber.next();
            })
    );
    (bluetoothMock.disconnect as jest.Mock).mockImplementation(
        (peripheralId: PeripheralId) =>
            new Promise(resolve => {
                const subscriber = connections.get(peripheralId);
                subscriber?.complete();
                connections.delete(peripheralId);
                resolve();
            })
    );
    (bluetoothMock.write as jest.Mock).mockResolvedValue(undefined);
    (bluetoothMock.enableBluetooth as jest.Mock).mockResolvedValue(undefined);
    /*const MuTagDevicesMock = jest.fn<MuTagDevicesPort, any>(
        (): MuTagDevicesPort => ({
            unprovisionMuTag: jest.fn(),
            connectToProvisionedMuTag: jest.fn(),
            disconnectFromProvisionedMuTag: jest.fn(),
            readBatteryLevel: jest.fn()
        })
    );*/

    const MuTagRepoLocalMock = jest.fn<MuTagRepositoryLocalPort, any>(
        (): MuTagRepositoryLocalPort => ({
            getByUid: jest.fn(),
            removeByUid: jest.fn()
        })
    );

    const MuTagRepoRemoteMock = jest.fn<MuTagRepositoryRemotePort, any>(
        (): MuTagRepositoryRemotePort => ({
            removeByUid: jest.fn()
        })
    );

    const AccountRepoLocalMock = jest.fn<AccountRepositoryLocalPort, any>(
        (): AccountRepositoryLocalPort => ({
            get: jest.fn(),
            update: jest.fn()
        })
    );

    const AccountRepoRemoteMock = jest.fn<AccountRepositoryRemotePort, any>(
        (): AccountRepositoryRemotePort => ({
            update: jest.fn()
        })
    );

    const RemoveMuTagOutputMock = jest.fn<RemoveMuTagOutputPort, any>(
        (): RemoveMuTagOutputPort => ({
            showBusyIndicator: jest.fn(),
            hideBusyIndicator: jest.fn(),
            showError: jest.fn()
        })
    );

    //const muTagDevicesMock = new MuTagDevicesMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const accountRepoRemoteMock = new AccountRepoRemoteMock();
    const removeMuTagOutputMock = new RemoveMuTagOutputMock();

    const removeMuTagBatteryThreshold = new Percent(15);
    const removeMuTagInteractor = new RemoveMuTagInteractor(
        removeMuTagBatteryThreshold,
        muTagDevices,
        accountRepoLocalMock,
        accountRepoRemoteMock,
        muTagRepoLocalMock,
        muTagRepoRemoteMock,
        removeMuTagOutputMock
    );

    const recycledBeaconIds = [BeaconId.create("2"), BeaconId.create("5")];
    const validAccountData: AccountData = {
        _uid: "AZeloSR9jCOUxOWnf5RYN14r2632",
        _accountNumber: AccountNumber.fromString("0000000"),
        _emailAddress: "support+test@informu.io",
        _name: "Josh McDaniel",
        _nextBeaconId: BeaconId.create("A"),
        _nextSafeZoneNumber: 3,
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _nextMuTagNumber: 10,
        _onboarding: false,
        _muTags: new Set(["randomUUID#1"])
    };
    const account = new Account(validAccountData);
    const removeMuTagSpy = jest.spyOn(account, "removeMuTag");

    const muTagUid = "randomUUID#1";
    const beaconId = BeaconId.create("1");
    const muTagBatteryLevel = new Percent(16);
    const newMuTagAttachedTo = "keys";
    const muTagColorSetting = MuTagColor.Scarlet;
    const muTagIsSafe = true;
    const muTagLastSeen = new Date();
    const muTag = new ProvisionedMuTag({
        _advertisingInterval: 1,
        _batteryLevel: muTagBatteryLevel,
        _beaconId: beaconId,
        _color: muTagColorSetting,
        _dateAdded: muTagLastSeen,
        _didExitRegion: false,
        _firmwareVersion: "1.6.1",
        _isSafe: muTagIsSafe,
        _lastSeen: muTagLastSeen,
        _macAddress: "AABBCCDDFF67",
        _modelNumber: "REV8",
        _muTagNumber: 1,
        _name: newMuTagAttachedTo,
        _recentLatitude: 0,
        _recentLongitude: 0,
        _txPower: 1,
        _uid: muTagUid
    });
    const manufacturerDataJson =
        "[2,1,6,26,255,76,0,2,21,222,126,199,237,16,85,176,85,192,222,222,254,167,237,250,126,255,255,255,255,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]";
    const manufacturerDataBytes = new Uint8Array(
        JSON.parse(manufacturerDataJson)
    );
    const manufacturerDataBase64 =
        "AgEGGv9MAAIV3n7H7RBVsFXA3t7+p+36fv////+2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const manufacturerData: ManufacturerData = {
        bytes: manufacturerDataBytes,
        data: manufacturerDataBase64,
        cdvType: "ArrayBuffer"
    };
    const discoveredPeripheral: Peripheral = {
        id: uuidV4() as PeripheralId,
        name: "informu beacon",
        rssi: -55 as Rssi,
        advertising: {
            isConnectable: true,
            serviceUuids: [],
            manufacturerData: manufacturerData,
            serviceData: {},
            txPowerLevel: 6
        }
    };

    describe("Mu tag removes successfully", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
            discoveredPeripheralSubscriber.next(discoveredPeripheral);
        });

        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromNumber(1)
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0000")
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0001")
        );

        // Given the Mu tag battery is above threshold
        //
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            muTagBatteryLevel
        );

        // Given Mu tag hardware unprovisions successfully

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagInteractor.remove(muTagUid);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.showBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should connect to the Mu tag", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                4,
                discoveredPeripheral.id,
                MuTagBLEGATT.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(4);
        });

        // Then
        //
        it("should unprovision the Mu tag hardware", (): void => {
            expect(bluetoothMock.write).toHaveBeenNthCalledWith(
                3,
                discoveredPeripheral.id,
                MuTagBLEGATT.MuTagConfiguration.Provision,
                MuTagBLEGATT.MuTagConfiguration.Provision.unprovisionCode
            );
        });

        // Then
        //
        it("should remove the Mu tag from local persistence", (): void => {
            expect(removeMuTagSpy).toHaveBeenCalledTimes(1);
            const _recycledBeaconIds = account.json._recycledBeaconIds;
            expect(_recycledBeaconIds).toContain(beaconId.toString());

            expect(accountRepoLocalMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoLocalMock.update).toHaveBeenCalledTimes(1);
            expect(muTagRepoLocalMock.removeByUid).toHaveBeenCalledWith(
                muTagUid
            );
            expect(muTagRepoLocalMock.removeByUid).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should remove the Mu tag from remote persistence", (): void => {
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);

            expect(muTagRepoRemoteMock.removeByUid).toHaveBeenCalledWith(
                muTagUid,
                validAccountData._uid
            );
            expect(muTagRepoRemoteMock.removeByUid).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should hide busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.hideBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });
    });

    describe("Mu tag is unconnectable", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is unconnectable
        //
        const originatingError = Error("Failed to connect to device");

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(
                    () => {
                        discoveredPeripheralSubscriber.next(
                            discoveredPeripheral
                        );
                    }
                );
                (bluetoothMock.connect as jest.Mock).mockImplementationOnce(
                    (peripheralId: PeripheralId) =>
                        new Observable<void>(subscriber => {
                            connections.set(peripheralId, subscriber);
                            subscriber.next();
                        })
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromNumber(1)
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromString("0000")
                );
                (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
                    Hexadecimal.fromString("0001")
                );
                (bluetoothMock.connect as jest.Mock).mockImplementationOnce(
                    () =>
                        new Observable<void>(subscriber => {
                            subscriber.error(originatingError);
                        })
                );
                // user removes Mu tag
                await removeMuTagInteractor.remove(muTagUid);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.showBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should connect to the Mu tag", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(2);
        });

        // Then
        //
        it("should hide busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.hideBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show message to move Mu tag closer to mobile device, check Mu tag battery level, and try again", (): void => {
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledWith(
                UserError.create(FailedToConnectToMuTag, originatingError)
            );
        });
    });

    describe("Mu tag hardware fails to unprovision", (): void => {
        // There is currently no way to know if unprovision failed
    });

    describe("Mu tag battery is below threshold", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (bluetoothMock.startScan as jest.Mock).mockImplementationOnce(() => {
            discoveredPeripheralSubscriber.next(discoveredPeripheral);
        });

        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromNumber(1)
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0000")
        );
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            Hexadecimal.fromString("0001")
        );

        // Given the Mu tag battery is above threshold
        //
        (bluetoothMock.read as jest.Mock).mockResolvedValueOnce(
            new Percent(14)
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagInteractor.remove(muTagUid);
            }
        );

        afterAll((): void => {
            jest.clearAllMocks();
        });

        // Then
        //
        it("should show busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.showBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should connect to the Mu tag", (): void => {
            expect(bluetoothMock.connect).toHaveBeenCalledWith(
                discoveredPeripheral.id
            );
            expect(bluetoothMock.connect).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(bluetoothMock.read).toHaveBeenNthCalledWith(
                1,
                discoveredPeripheral.id,
                MuTagBLEGATT.DeviceInformation.BatteryLevel
            );
            expect(bluetoothMock.read).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should disconnect from the Mu tag", (): void => {
            // This happens automatically because Mu tag restarts upon unprovision
        });

        // Then
        //
        it("should hide busy indicator", (): void => {
            expect(
                removeMuTagOutputMock.hideBusyIndicator
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should show message that removal failed, Mu tag battery needs to be charged, and then try again", (): void => {
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledWith(
                UserError.create(
                    LowMuTagBattery(removeMuTagBatteryThreshold.valueOf())
                )
            );
        });
    });
});
