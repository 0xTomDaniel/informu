import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import MuTagDevicesPort from "./MuTagDevicesPort";
import BackgroundTaskPort from "./BackgroundTaskPort";
import { Millisecond } from "../../shared/metaLanguage/Types";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import Logger from "../../shared/metaLanguage/Logger";
import { AccountNumber } from "../../../source/Core/Domain/Account";
import { switchMap } from "rxjs/operators";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Percent from "../../shared/metaLanguage/Percent";

export default class MuTagBatteriesInteractor {
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly backgroundTask: BackgroundTaskPort;
    private readonly batteryReadInterval = 43200000 as Millisecond;
    private readonly batteryReadRetryInterval = 14400000 as Millisecond;
    private readonly lastBatteryReadTimestamps = new Map<string, Date>();
    private readonly logger = Logger.instance;
    private readonly muTagDevices: MuTagDevicesPort;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;

    constructor(
        accountRepoLocal: AccountRepositoryLocalPort,
        backgroundTask: BackgroundTaskPort,
        muTagDevices: MuTagDevicesPort,
        muTagRepoLocal: MuTagRepositoryLocalPort
    ) {
        this.accountRepoLocal = accountRepoLocal;
        this.backgroundTask = backgroundTask;
        this.muTagDevices = muTagDevices;
        this.muTagRepoLocal = muTagRepoLocal;
    }

    async start(): Promise<void> {
        const muTags = await this.muTagRepoLocal.getAll();
        const account = await this.accountRepoLocal.get();
        muTags.forEach(async muTag => {
            this.lastBatteryReadTimestamps.set(muTag.uid, new Date());
            this.queueBatteryRead(account.accountNumber, muTag);
            this.setupBatteryReadRetries(account.accountNumber, muTag);
        });
    }

    private queueBatteryRead(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ): void {
        this.backgroundTask.queueRepeatedTask(this.batteryReadInterval, () => {
            if (!this.isReadyToReadBattery(muTag.uid)) {
                return;
            }
            if (!muTag.inRange) {
                const error = Error(
                    `Belonging (${muTag.name}) not in range for battery read.`
                );
                this.logger.warn(error);
                return;
            }
            this.updateMuTagBatteryLevel(accountNumber, muTag);
        });
    }

    private setupBatteryReadRetries(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ): void {
        muTag.didEnterRegion.subscribe(
            () => {
                if (this.isReadyToReadBattery(muTag.uid)) {
                    this.updateMuTagBatteryLevel(accountNumber, muTag);
                }
            },
            e => this.logger.error(e, true)
        );
    }

    private updateMuTagBatteryLevel(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ) {
        this.readMuTagBattery(accountNumber, muTag)
            .then(level => {
                muTag.updateBatteryLevel(level);
                return this.muTagRepoLocal.update(muTag);
            })
            .catch(e => this.logger.warn(e, true));
    }

    private isReadyToReadBattery(muTagUid: string): boolean {
        const timeNow = Date.now();
        const lastBatteryReadTime =
            this.lastBatteryReadTimestamps.get(muTagUid)?.getTime() ?? 0;
        const timeSinceLastBatteryRead = timeNow - lastBatteryReadTime;
        return timeSinceLastBatteryRead >= this.batteryReadInterval;
    }

    private async readMuTagBattery(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ): Promise<Percent> {
        const batteryLevel = await this.muTagDevices
            .connectToProvisionedMuTag(accountNumber, muTag.beaconId)
            .pipe(
                switchMap(() =>
                    this.muTagDevices
                        .readBatteryLevel(accountNumber, muTag.beaconId)
                        .finally(() =>
                            this.muTagDevices.disconnectFromProvisionedMuTag(
                                accountNumber,
                                muTag.beaconId
                            )
                        )
                )
            )
            .toPromise();
        this.lastBatteryReadTimestamps.set(muTag.uid, new Date());
        return batteryLevel;
    }
}
