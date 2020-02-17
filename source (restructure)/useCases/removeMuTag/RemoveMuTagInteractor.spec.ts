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
    FailedToConnectToMuTag,
    MuTagCommunicationFailure
} from "./RemoveMuTagInteractor";
import { RemoveMuTagOutputPort } from "./RemoveMuTagOutputPort";
import MuTagDevicesPort from "./MuTagDevicesPort";

describe("Mu tag user removes Mu tag", (): void => {
    const MuTagDevicesMock = jest.fn<MuTagDevicesPort, any>(
        (): MuTagDevicesPort => ({
            unprovisionMuTag: jest.fn(),
            connectToProvisionedMuTag: jest.fn(),
            disconnectFromProvisionedMuTag: jest.fn(),
            readBatteryLevel: jest.fn()
        })
    );

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

    const muTagDevicesMock = new MuTagDevicesMock();
    const muTagRepoLocalMock = new MuTagRepoLocalMock();
    const muTagRepoRemoteMock = new MuTagRepoRemoteMock();
    const accountRepoLocalMock = new AccountRepoLocalMock();
    const accountRepoRemoteMock = new AccountRepoRemoteMock();
    const removeMuTagOutputMock = new RemoveMuTagOutputMock();

    const removeMuTagBatteryThreshold = new Percent(15);
    const removeMuTagService = new RemoveMuTagInteractor(
        removeMuTagBatteryThreshold,
        muTagDevicesMock,
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
        _nextBeaconId: BeaconId.create("A"),
        _recycledBeaconIds: new Set(recycledBeaconIds),
        _nextMuTagNumber: 10,
        _muTags: new Set(["randomUUID#1"])
    };
    const account = new Account(validAccountData);
    const removeMuTagSpy = jest.spyOn(account, "removeMuTag");

    const muTagUID = "randomUUID#1";
    const beaconId = BeaconId.create("1");
    const muTagBatteryLevel = new Percent(17);
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
        _modelNumber: "REV8",
        _muTagNumber: 1,
        _name: newMuTagAttachedTo,
        _recentLatitude: 0,
        _recentLongitude: 0,
        _txPower: 1,
        _uid: muTagUID
    });

    describe("Mu tag removes successfully", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (muTagDevicesMock.connectToProvisionedMuTag as jest.Mock).mockResolvedValueOnce(
            undefined
        );

        // Given the Mu tag battery is above threshold
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(
            new Percent(16)
        );

        // Given Mu tag hardware unprovisions successfully
        //
        (muTagDevicesMock.unprovisionMuTag as jest.Mock).mockResolvedValueOnce(
            undefined
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagService.remove(muTagUID);
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
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(muTagDevicesMock.readBatteryLevel).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should unprovision the Mu tag hardware", (): void => {
            expect(muTagDevicesMock.unprovisionMuTag).toHaveBeenCalledTimes(1);
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
                muTagUID
            );
            expect(muTagRepoLocalMock.removeByUid).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should remove the Mu tag from remote persistence", (): void => {
            expect(accountRepoRemoteMock.update).toHaveBeenCalledWith(account);
            expect(accountRepoRemoteMock.update).toHaveBeenCalledTimes(1);

            expect(muTagRepoRemoteMock.removeByUid).toHaveBeenCalledWith(
                muTagUID,
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
        const originatingError = Error();
        (muTagDevicesMock.connectToProvisionedMuTag as jest.Mock).mockRejectedValueOnce(
            originatingError
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagService.remove(muTagUID);
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
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledTimes(1);
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
                new FailedToConnectToMuTag(originatingError)
            );
        });
    });

    describe("Mu tag hardware fails to unprovision", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (muTagDevicesMock.connectToProvisionedMuTag as jest.Mock).mockResolvedValueOnce(
            undefined
        );

        // Given the Mu tag battery is above threshold
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(
            new Percent(16)
        );

        // Given Mu tag hardware fails to unprovision
        //
        const originatingError = Error();
        (muTagDevicesMock.unprovisionMuTag as jest.Mock).mockRejectedValueOnce(
            originatingError
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagService.remove(muTagUID);
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
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(muTagDevicesMock.readBatteryLevel).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should unprovision the Mu tag hardware", (): void => {
            expect(muTagDevicesMock.unprovisionMuTag).toHaveBeenCalledTimes(1);
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
        it("should show message that Mu tag failed to remove, to move closer to mobile device, and try again", (): void => {
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledTimes(1);
            expect(removeMuTagOutputMock.showError).toHaveBeenCalledWith(
                new MuTagCommunicationFailure(originatingError)
            );
        });
    });

    describe("Mu tag battery is below threshold", (): void => {
        // Given that the account connected to the current Mu tag is logged in
        //
        (accountRepoLocalMock.get as jest.Mock).mockResolvedValueOnce(account);
        (muTagRepoLocalMock.getByUid as jest.Mock).mockResolvedValueOnce(muTag);

        // Given Mu tag is connectable
        //
        (muTagDevicesMock.connectToProvisionedMuTag as jest.Mock).mockResolvedValueOnce(
            undefined
        );

        // Given the Mu tag battery is below threshold
        //
        (muTagDevicesMock.readBatteryLevel as jest.Mock).mockResolvedValueOnce(
            new Percent(14)
        );

        // When
        //
        beforeAll(
            async (): Promise<void> => {
                // user removes Mu tag
                await removeMuTagService.remove(muTagUID);
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
            expect(
                muTagDevicesMock.connectToProvisionedMuTag
            ).toHaveBeenCalledTimes(1);
        });

        // Then
        //
        it("should check the Mu tag battery level", (): void => {
            expect(muTagDevicesMock.readBatteryLevel).toHaveBeenCalledTimes(1);
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
                new LowMuTagBattery(removeMuTagBatteryThreshold.valueOf())
            );
        });
    });
});
