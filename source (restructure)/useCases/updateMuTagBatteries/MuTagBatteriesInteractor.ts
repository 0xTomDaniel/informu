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
import { Subscription } from "rxjs";

export default class MuTagBatteriesInteractor {
    private accountMuTagsChangeSubscription: Subscription | undefined;
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly backgroundTask: BackgroundTaskPort;
    private readonly backgroundTaskUids = new Map<string, string>();
    private readonly batteryReadInterval = 43200000 as Millisecond;
    private readonly batteryReadRetryInterval = 14400000 as Millisecond;
    private readonly didEnterRegionSubscriptions = new Map<
        string,
        Subscription
    >();
    private hasStarted = false;
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
        if (this.hasStarted) {
            return;
        }
        this.hasStarted = true;
        const muTags = await this.muTagRepoLocal.getAll();
        const account = await this.accountRepoLocal.get();
        muTags.forEach(async muTag =>
            this.startUpBatteryReads(muTag, account.accountNumber)
        );
        this.accountMuTagsChangeSubscription = account.muTagsChange.subscribe(
            change => {
                if (change.insertion != null) {
                    this.muTagRepoLocal
                        .getByUid(change.insertion)
                        .then(muTag =>
                            this.startUpBatteryReads(
                                muTag,
                                account.accountNumber
                            )
                        )
                        .catch(e => this.logger.error(e, true));
                }
                if (change.deletion != null) {
                    this.shutDownBatteryReads(change.deletion);
                }
            }
        );
    }

    stop(): void {
        if (!this.hasStarted) {
            return;
        }
        for (const key of this.lastBatteryReadTimestamps.keys()) {
            this.shutDownBatteryReads(key);
        }
        this.hasStarted = false;
    }

    private startUpBatteryReads(
        muTag: ProvisionedMuTag,
        accountNumber: AccountNumber
    ): void {
        this.lastBatteryReadTimestamps.set(muTag.uid, new Date());
        this.enqueueBatteryReads(accountNumber, muTag);
        this.setUpBatteryReadRetries(accountNumber, muTag);
    }

    private shutDownBatteryReads(muTagUid: string): void {
        this.lastBatteryReadTimestamps.delete(muTagUid);
        this.dequeueBatteryReads(muTagUid);
        this.tearDownBatteryReadRetries(muTagUid);
    }

    private enqueueBatteryReads(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ): void {
        const taskUid = this.backgroundTask.enqueueRepeatedTask(
            this.batteryReadInterval,
            async () => {
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
                await this.updateMuTagBatteryLevel(
                    accountNumber,
                    muTag
                ).catch(e => this.logger.warn(e, true));
            }
        );
        this.backgroundTaskUids.set(muTag.uid, taskUid);
    }

    private dequeueBatteryReads(muTagUid: string): void {
        const taskUid = this.backgroundTaskUids.get(muTagUid);
        if (taskUid != null) {
            this.backgroundTask.dequeueRepeatedTask(taskUid);
        }
    }

    private setUpBatteryReadRetries(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ) {
        const subscription = muTag.didEnterRegion.subscribe(
            () => {
                if (this.isReadyToReadBattery(muTag.uid)) {
                    this.updateMuTagBatteryLevel(accountNumber, muTag);
                }
            },
            e => this.logger.error(e, true)
        );
        this.didEnterRegionSubscriptions.set(muTag.uid, subscription);
    }

    private tearDownBatteryReadRetries(muTagUid: string): void {
        this.didEnterRegionSubscriptions.get(muTagUid)?.unsubscribe();
    }

    private async updateMuTagBatteryLevel(
        accountNumber: AccountNumber,
        muTag: ProvisionedMuTag
    ) {
        const batteryLevel = await this.readMuTagBattery(accountNumber, muTag);
        muTag.updateBatteryLevel(batteryLevel);
        await this.muTagRepoLocal.update(muTag);
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
