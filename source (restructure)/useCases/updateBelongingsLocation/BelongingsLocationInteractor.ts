import LocationMonitorPort, { Location } from "./LocationMonitorPort";
import { Subscription } from "rxjs";
import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import { take } from "rxjs/operators";
import { AccountRepositoryLocal } from "../../../source/Core/Ports/AccountRepositoryLocal";
import ProvisionedMuTag from "../../../source/Core/Domain/ProvisionedMuTag";
import Logger from "../../shared/metaLanguage/Logger";
import {
    GeolocationOptions,
    GeolocationAccuracy,
    LocationProvider
} from "../../shared/geolocation/LocationMonitor";
import Localize from "../../shared/localization/Localize";

export interface BelongingsLocation {
    start(): Promise<void>;
    stop(): void;
}

export default class BelongingsLocationInteractor
    implements BelongingsLocation {
    constructor(
        accountRepoLocal: AccountRepositoryLocal,
        locationMonitor: LocationMonitorPort,
        muTagRepoLocal: MuTagRepositoryLocalPort
    ) {
        this.accountRepoLocal = accountRepoLocal;
        this.defaultLocationMonitorOptions = {
            activitiesInterval: 10000,
            desiredAccuracy: GeolocationAccuracy.Medium,
            fastestInterval: 5000,
            interval: 10000,
            locationProvider: LocationProvider.Activity,
            //notificationIconColor: string,
            //notificationIconLarge: string,
            //notificationIconSmall: string,
            notificationTitle: this.localize.getText(
                "belongingsLocation",
                "foregroundServiceNotification",
                "title"
            ),
            notificationText: this.localize.getText(
                "belongingsLocation",
                "foregroundServiceNotification",
                "description"
            ),
            stopOnTerminate: false,
            startForeground: true,
            startOnBoot: true
        };
        this.locationMonitor = locationMonitor;
        this.muTagRepoLocal = muTagRepoLocal;

        this.locationMonitor.configure(this.defaultLocationMonitorOptions);
    }

    async start(): Promise<void> {
        if (this.hasStarted) {
            return;
        }
        this.hasStarted = true;
        this.locationSubscription = this.locationMonitor.location.subscribe(
            location => {
                this.muTagRepoLocal
                    .getAll()
                    .then(muTags => {
                        muTags.forEach(muTag =>
                            this.updateMuTagLocation(muTag, location).catch(e =>
                                this.logger.warn(e, true)
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
                            this.updateMuTagWithLocationSubscription(muTag);
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
        if (!this.hasStarted) {
            return;
        }
        this.accountMuTagsChangeSubscription?.unsubscribe();
        this.locationSubscription?.unsubscribe();
        this.muTagDetectionSubscriptions.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.hasStarted = false;
    }

    private accountMuTagsChangeSubscription?: Subscription;
    private readonly accountRepoLocal: AccountRepositoryLocal;
    private readonly defaultLocationMonitorOptions: GeolocationOptions;
    private hasStarted = false;
    private readonly localize = Localize.instance;
    private readonly locationMonitor: LocationMonitorPort;
    private locationSubscription?: Subscription;
    private readonly logger = Logger.instance;
    private readonly muTagDetectionSubscriptions = new Map<
        string,
        Subscription
    >();
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;

    private updateMuTagLocationWhenDetected(
        muTags: Set<ProvisionedMuTag>
    ): void {
        muTags.forEach(muTag => {
            const subscription = muTag.didEnterRegion.subscribe(() =>
                this.updateMuTagWithLocationSubscription(muTag)
            );
            this.muTagDetectionSubscriptions.set(muTag.uid, subscription);
        });
    }

    private updateMuTagWithLocationSubscription(muTag: ProvisionedMuTag): void {
        this.locationMonitor.location
            .pipe(take(1))
            .subscribe(location =>
                this.updateMuTagLocation(muTag, location).catch(e =>
                    this.logger.warn(e, true)
                )
            );
    }

    private async updateMuTagLocation(
        muTag: ProvisionedMuTag,
        location: Location
    ): Promise<void> {
        muTag.updateLocation(location.latitude, location.longitude);
        if (location.address != null) {
            muTag.updateAddress(location.address);
        }
        await this.muTagRepoLocal.update(muTag);
    }
}
