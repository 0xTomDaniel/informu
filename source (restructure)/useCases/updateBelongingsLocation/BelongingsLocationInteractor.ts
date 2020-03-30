import LocationMonitorPort from "./LocationMonitorPort";
import { Subscription } from "rxjs";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import { take } from "rxjs/operators";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Logger from "../../shared/metaLanguage/Logger";

export interface BelongingsLocation {
    start(): Promise<void>;
    stop(): void;
}

export default class BelongingsLocationInteractor
    implements BelongingsLocation {
    private accountMuTagsChangeSubscription?: Subscription;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly locationMonitor: LocationMonitorPort;
    private locationSubscription?: Subscription;
    private readonly muTagDetectionSubscriptions = new Map<
        string,
        Subscription
    >();
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;

    constructor(
        accountRepoLocal: AccountRepositoryLocal,
        locationMonitor: LocationMonitorPort,
        muTagRepoLocal: MuTagRepositoryLocalPort
    ) {
        this.accountRepoLocal = accountRepoLocal;
        this.locationMonitor = locationMonitor;
        this.muTagRepoLocal = muTagRepoLocal;
    }

    async start(): Promise<void> {
        this.locationSubscription = this.locationMonitor.location.subscribe(
            location => {
                this.muTagRepoLocal
                    .getAll()
                    .then(muTags => {
                        muTags.forEach(muTag =>
                            muTag.updateLocation(
                                location.latitude,
                                location.longitude,
                                location.address
                            )
                        );
                    })
                    .catch(e => Logger.instance.error(e, true));
            }
        );
        const muTags = await this.muTagRepoLocal.getAll();
        this.updateMuTagLocationWhenDetected(muTags);
        const account = await this.accountRepoLocal.get();
        this.accountMuTagsChangeSubscription = account.muTagsChange.subscribe(
            change => {
                if (change.insertion != null) {
                    this.muTagRepoLocal
                        .getByUid(change.insertion)
                        .then(muTag => {
                            this.updateMuTagLocation(muTag);
                            this.updateMuTagLocationWhenDetected(
                                new Set([muTag])
                            );
                        })
                        .catch(e => Logger.instance.error(e, true));
                }
                if (change.deletion != null) {
                    const subscription = this.muTagDetectionSubscriptions.get(
                        change.deletion
                    );
                    subscription?.unsubscribe();
                    this.muTagDetectionSubscriptions.delete(change.deletion);
                }
            }
        );
    }

    stop(): void {
        this.accountMuTagsChangeSubscription?.unsubscribe();
        this.locationSubscription?.unsubscribe();
        this.muTagDetectionSubscriptions.forEach(subscription =>
            subscription.unsubscribe()
        );
    }

    private updateMuTagLocationWhenDetected(
        muTags: Set<ProvisionedMuTag>
    ): void {
        muTags.forEach(muTag => {
            const subscription = muTag.didEnterRegion.subscribe(() =>
                this.updateMuTagLocation(muTag)
            );
            this.muTagDetectionSubscriptions.set(muTag.uid, subscription);
        });
    }

    private updateMuTagLocation(muTag: ProvisionedMuTag): void {
        this.locationMonitor.location.pipe(take(1)).subscribe(location => {
            muTag.updateLocation(
                location.latitude,
                location.longitude,
                location.address
            );
        });
    }
}
