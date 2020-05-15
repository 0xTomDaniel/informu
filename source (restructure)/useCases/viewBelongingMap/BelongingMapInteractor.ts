import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import ProvisionedMuTag, {
    Location
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Logger from "../../shared/metaLanguage/Logger";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import { Subscription, Observable, Subject } from "rxjs";
import CollectionUpdate from "../../shared/metaLanguage/CollectionUpdate";
import { take, map } from "rxjs/operators";
import LifecycleObservable from "../../shared/metaLanguage/LifecycleObservable";

export interface BelongingLocation {
    name: string;
    latitude: number;
    longitude: number;
}

export interface BelongingLocationDelta {
    name?: string;
    latitude?: number;
    longitude?: number;
}

export default interface BelongingMapInteractor {
    showOnMap: Observable<
        CollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >;
}

export class BelongingMapInteractorImpl implements BelongingMapInteractor {
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly belongingLocations: BelongingLocation[] = [];
    private readonly belongingLocationsUidToIndex: Map<
        string,
        number
    > = new Map();
    private readonly locationSubscriptions = new Map<string, Subscription>();
    private readonly logger = Logger.instance;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private muTagsChangeSubscription: Subscription | undefined;
    readonly showOnMap = LifecycleObservable(
        new Observable<
            CollectionUpdate<BelongingLocation, BelongingLocationDelta>
        >(subscriber => {
            this.showOnMapSubject.subscribe(subscriber);
            // Must copy the array 'belongingLocations' to prevent mutation of
            // original.
            subscriber.next({ initial: [...this.belongingLocations] });
        }),
        this.start.bind(this),
        this.stop.bind(this)
    );
    private readonly showOnMapSubject = new Subject<
        CollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >();

    constructor(
        accountRepoLocal: AccountRepositoryLocalPort,
        muTagRepoLocal: MuTagRepositoryLocalPort
    ) {
        this.accountRepoLocal = accountRepoLocal;
        this.muTagRepoLocal = muTagRepoLocal;
    }

    private async start(): Promise<void> {
        const account = await this.accountRepoLocal.get();
        this.muTagsChangeSubscription = account.muTagsChange.subscribe(
            (change): void => {
                if (change.insertion != null) {
                    this.muTagRepoLocal
                        .getByUid(change.insertion)
                        .then(belonging =>
                            this.showLocationOnMap(new Set([belonging]))
                        )
                        .catch(e => this.logger.warn(e, true));
                }

                if (change.deletion != null) {
                    const index = this.belongingLocationsUidToIndex.get(
                        change.deletion
                    );
                    if (index == null) {
                        this.logger.warn("Index not found.", true);
                        return;
                    }
                    this.belongingLocations.splice(index, 1);
                    this.belongingLocationsUidToIndex.delete(change.deletion);
                    this.showOnMapSubject.next({
                        removed: [{ index: index }]
                    });
                    this.locationSubscriptions
                        .get(change.deletion)
                        ?.unsubscribe();
                }
            }
        );
        const belongings = await this.muTagRepoLocal.getAll();
        await this.showLocationOnMap(belongings, true);
    }

    private async stop(): Promise<void> {
        this.locationSubscriptions.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagsChangeSubscription?.unsubscribe();
        this.belongingLocations.length = 0;
        this.belongingLocationsUidToIndex.clear();
    }

    private async showLocationOnMap(
        belongings: Set<ProvisionedMuTag>,
        initial = false
    ): Promise<void> {
        const locations: Promise<{
            belonging: ProvisionedMuTag;
            location: Location;
        }>[] = [];
        belongings.forEach(belonging =>
            locations.push(
                belonging.location
                    .pipe(
                        take(1),
                        map(location => ({
                            belonging: belonging,
                            location: location
                        }))
                    )
                    .toPromise()
            )
        );
        await Promise.all(locations)
            .then(results => {
                const belongingLocations = results.map(result => {
                    const belongingLocation: BelongingLocation = {
                        name: result.belonging.name,
                        latitude: result.location.latitude,
                        longitude: result.location.longitude
                    };
                    const index =
                        this.belongingLocations.push(belongingLocation) - 1;
                    this.belongingLocationsUidToIndex.set(
                        result.belonging.uid,
                        index
                    );
                    return {
                        index: index,
                        element: belongingLocation
                    };
                });
                if (!initial) {
                    this.showOnMapSubject.next({
                        added: belongingLocations
                    });
                }
            })
            .catch(e => this.logger.warn(e, true));
        belongings.forEach(belonging => {
            const index = this.belongingLocationsUidToIndex.get(belonging.uid);
            if (index == null) {
                this.logger.warn("Index not found.", true);
                return;
            }
            const subscription = belonging.location.subscribe(
                location =>
                    this.showOnMapSubject.next({
                        changed: [
                            {
                                index: index,
                                elementChange: {
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                }
                            }
                        ]
                    }),
                error => this.logger.warn(error, true)
            );
            this.locationSubscriptions.set(belonging.uid, subscription);
        });
    }
}
