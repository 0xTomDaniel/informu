import MuTagRepositoryLocal from "../../../source/Core/Ports/MuTagRepositoryLocal";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import ProvisionedMuTag, {
    Address
} from "../../../source/Core/Domain/ProvisionedMuTag";
import { skip, take } from "rxjs/operators";
import ObjectCollectionUpdate from "../../shared/metaLanguage/ObjectCollectionUpdate";
import { Observable, Subject, Subscription } from "rxjs";
import Percent from "../../shared/metaLanguage/Percent";
import Logger from "../../shared/metaLanguage/Logger";
import LifecycleObservable from "../../shared/metaLanguage/LifecycleObservable";

export interface DashboardBelonging {
    readonly address: string | undefined;
    readonly batteryLevel: Percent;
    readonly isSafe: boolean;
    readonly lastSeen: Date;
    readonly name: string;
    readonly uid: string;
}

export type DashboardBelongingDelta = Partial<DashboardBelonging> & {
    readonly uid: string;
};

export default interface BelongingDashboardInteractor {
    readonly dashboardBelongings: Observable<
        ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
    >;
}

export class BelongingDashboardInteractorImpl
    implements BelongingDashboardInteractor {
    readonly dashboardBelongings: Observable<
        ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
    >;

    constructor(
        muTagRepoLocal: MuTagRepositoryLocal,
        accountRepoLocal: AccountRepositoryLocal
    ) {
        this.muTagRepoLocal = muTagRepoLocal;
        this.accountRepoLocal = accountRepoLocal;
        this.dashboardBelongings = LifecycleObservable(
            this._showOnDashboard,
            this.start.bind(this),
            this.stop.bind(this)
        );
    }

    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly logger = Logger.instance;
    private readonly muTagAddressSubscription = new Map<string, Subscription>();
    private readonly muTagBatteryLevelSubscription = new Map<
        string,
        Subscription
    >();
    private readonly muTagNameSubscription = new Map<string, Subscription>();
    private readonly muTagSafetyStatusSubscription = new Map<
        string,
        Subscription
    >();
    private readonly muTagIndexCache: string[] = [];
    private readonly muTagRepoLocal: MuTagRepositoryLocal;
    private muTagsChangeSubscription: Subscription | undefined;
    private readonly _showOnDashboard = new Subject<
        ObjectCollectionUpdate<DashboardBelonging, DashboardBelongingDelta>
    >();

    private async start(): Promise<void> {
        const muTags = await this.muTagRepoLocal.getAll();
        const belongings: DashboardBelonging[] = [];
        for (const muTag of muTags) {
            this.muTagIndexCache.push(muTag.uid);
            const dashboardBelonging = await this.toDashboardBelonging(muTag);
            belongings.push(dashboardBelonging);
        }
        this._showOnDashboard.next(
            new ObjectCollectionUpdate({ initial: belongings })
        );
        await this.subscribeToAccountMuTagChanges();
        muTags.forEach((muTag): void => {
            this.updateDashboardOnAddressChange(muTag);
            this.updateDashboardOnBatteryLevelChange(muTag);
            this.updateDashboardOnNameChange(muTag);
            this.updateDashboardOnSafetyStatusChange(muTag);
        });
    }

    private async stop(): Promise<void> {
        this.muTagAddressSubscription.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagBatteryLevelSubscription.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagNameSubscription.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagSafetyStatusSubscription.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagsChangeSubscription?.unsubscribe();
        this.muTagIndexCache.length = 0;
    }

    private async subscribeToAccountMuTagChanges(): Promise<void> {
        const account = await this.accountRepoLocal.get();
        this.muTagsChangeSubscription = account.muTagsChange.subscribe(
            async (change): Promise<void> => {
                if (change.insertion != null) {
                    try {
                        const muTag = await this.muTagRepoLocal.getByUid(
                            change.insertion
                        );
                        const dashboardBelonging = await this.toDashboardBelonging(
                            muTag
                        );
                        const index = this.muTagIndexCache.push(muTag.uid) - 1;
                        this._showOnDashboard.next(
                            new ObjectCollectionUpdate({
                                added: [
                                    {
                                        index: index,
                                        element: dashboardBelonging
                                    }
                                ]
                            })
                        );
                        this.updateDashboardOnAddressChange(muTag);
                        this.updateDashboardOnBatteryLevelChange(muTag);
                        this.updateDashboardOnNameChange(muTag);
                        this.updateDashboardOnSafetyStatusChange(muTag);
                    } catch (e) {
                        this.logger.error(e, true, true);
                    }
                }

                if (change.deletion != null) {
                    this.muTagAddressSubscription
                        .get(change.deletion)
                        ?.unsubscribe();
                    this.muTagBatteryLevelSubscription
                        .get(change.deletion)
                        ?.unsubscribe();
                    this.muTagNameSubscription
                        .get(change.deletion)
                        ?.unsubscribe();
                    this.muTagSafetyStatusSubscription
                        .get(change.deletion)
                        ?.unsubscribe();
                    const index = this.muTagIndexCache.indexOf(change.deletion);
                    this.muTagIndexCache.splice(index, 1);
                    this._showOnDashboard.next(
                        new ObjectCollectionUpdate({
                            removed: [
                                {
                                    index: index
                                }
                            ]
                        })
                    );
                }
            }
        );
    }

    private async toDashboardBelonging(
        muTag: ProvisionedMuTag
    ): Promise<DashboardBelonging> {
        let batteryLevel: Percent;
        try {
            batteryLevel = await muTag.batteryLevel.pipe(take(1)).toPromise();
        } catch (e) {
            batteryLevel = new Percent(0);
            this.logger.warn(e, true);
        }
        return {
            address: undefined,
            batteryLevel: batteryLevel,
            uid: muTag.uid,
            name: muTag.nameValue,
            isSafe: muTag.isSafe,
            lastSeen: muTag.lastSeen
        };
    }

    private updateDashboardOnAddressChange(muTag: ProvisionedMuTag): void {
        const subscription = muTag.address.subscribe(addressUpdate => {
            const index = this.muTagIndexCache.indexOf(muTag.uid);
            this._showOnDashboard.next(
                new ObjectCollectionUpdate({
                    changed: [
                        {
                            index: index,
                            elementChange: {
                                uid: muTag.uid,
                                address: This.addressOutput(addressUpdate)
                            }
                        }
                    ]
                })
            );
        });
        this.muTagAddressSubscription.set(muTag.uid, subscription);
    }

    private updateDashboardOnBatteryLevelChange(muTag: ProvisionedMuTag): void {
        const subscription = muTag.batteryLevel
            .pipe(skip(1))
            .subscribe(update => {
                const index = this.muTagIndexCache.indexOf(muTag.uid);
                this._showOnDashboard.next(
                    new ObjectCollectionUpdate({
                        changed: [
                            {
                                index: index,
                                elementChange: {
                                    uid: muTag.uid,
                                    batteryLevel: update
                                }
                            }
                        ]
                    })
                );
            });
        this.muTagBatteryLevelSubscription.set(muTag.uid, subscription);
    }

    private updateDashboardOnNameChange(muTag: ProvisionedMuTag): void {
        const subscription = muTag.name.pipe(skip(1)).subscribe(update => {
            const index = this.muTagIndexCache.indexOf(muTag.uid);
            this._showOnDashboard.next(
                new ObjectCollectionUpdate({
                    changed: [
                        {
                            index: index,
                            elementChange: {
                                uid: muTag.uid,
                                name: update
                            }
                        }
                    ]
                })
            );
        });
        this.muTagNameSubscription.set(muTag.uid, subscription);
    }

    private updateDashboardOnSafetyStatusChange(muTag: ProvisionedMuTag): void {
        const subscription = muTag.safetyStatus
            .pipe(skip(1))
            .subscribe((update): void => {
                const index = this.muTagIndexCache.indexOf(muTag.uid);
                this._showOnDashboard.next(
                    new ObjectCollectionUpdate({
                        changed: [
                            {
                                index: index,
                                elementChange: {
                                    uid: muTag.uid,
                                    isSafe: update.isSafe,
                                    lastSeen: update.lastSeen
                                }
                            }
                        ]
                    })
                );
            });
        this.muTagSafetyStatusSubscription.set(muTag.uid, subscription);
    }

    private static addressOutput(
        address: Address | undefined
    ): string | undefined {
        if (address == null) {
            return;
        }
        const route = address.route.length === 0 ? "" : `${address.route}, `;
        const locality =
            address.locality.length === 0 ? "" : `${address.locality}, `;
        const formattedAddress = `${route}${locality}${address.administrativeAreaLevel1}`;
        return formattedAddress.length === 0 ? undefined : formattedAddress;
    }
}

const This = BelongingDashboardInteractorImpl;
