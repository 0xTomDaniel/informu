import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import ProvisionedMuTag, {
    Location
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Logger from "../../shared/metaLanguage/Logger";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import { Subscription, Observable, Subject } from "rxjs";
import ObjectCollectionUpdate from "../../shared/metaLanguage/ObjectCollectionUpdate";
import { take, map, distinctUntilChanged } from "rxjs/operators";
import LifecycleObservable from "../../shared/metaLanguage/LifecycleObservable";
import { isEqual } from "lodash";

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
        ObjectCollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >;
}

export class BelongingMapInteractorImpl implements BelongingMapInteractor {
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly belongingLocationUids: string[] = [];
    private readonly locationSubscriptions = new Map<string, Subscription>();
    private readonly nameSubscriptions = new Map<string, Subscription>();
    private readonly logger = Logger.instance;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    private muTagsChangeSubscription: Subscription | undefined;
    private readonly showOnMapSubject = new Subject<
        ObjectCollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >();
    readonly showOnMap = LifecycleObservable(
        this.showOnMapSubject,
        this.start.bind(this),
        this.stop.bind(this)
    );

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
                    const index = this.belongingLocationUids.indexOf(change.deletion);
                    if (index == null) {
                        this.logger.warn("Index not found.", true);
                        return;
                    }
                    this.belongingLocationUids.splice(index, 1);
                    this.showOnMapSubject.next(
                        new ObjectCollectionUpdate({
                            removed: [{ index: index }]
                        })
                    );
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
        this.nameSubscriptions.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.locationSubscriptions.forEach(subscription =>
            subscription.unsubscribe()
        );
        this.muTagsChangeSubscription?.unsubscribe();
        this.belongingLocationUids.length = 0;
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
                let index: number;
                const initialBelongingLocations = results.map(result => {
                    index = this.belongingLocationUids.push(result.belonging.uid) - 1;
                    return {
                        name: result.belonging.nameValue,
                        latitude: result.location.latitude,
                        longitude: result.location.longitude
                    };
                })
                if (initial) {
                    this.showOnMapSubject.next(
                        new ObjectCollectionUpdate({
                            initial: [...initialBelongingLocations]
                        })
                    );
                } else {
                    const addedBelongingLocations = initialBelongingLocations.map(belongingLocation => {
                        return {
                            index: index,
                            element: belongingLocation
                        };
                    });
                    this.showOnMapSubject.next(
                        new ObjectCollectionUpdate({
                            added: addedBelongingLocations
                        })
                    );
                }
            })
            .catch(e => this.logger.warn(e, true));

        belongings.forEach(belonging => {
            const index = this.belongingLocationUids.indexOf(belonging.uid);
            if (index == null) {
                this.logger.warn("Index not found.", true);
                return;
            }

            const nameSubscription = belonging.name
                .pipe(distinctUntilChanged(isEqual))
                .subscribe(
                    name =>
                        this.showOnMapSubject.next(
                            new ObjectCollectionUpdate({
                                changed: [
                                    {
                                        index: index,
                                        elementChange: {
                                            name: name
                                        }
                                    }
                                ]
                            })
                        ),
                    error => this.logger.warn(error, true)
                );
            this.nameSubscriptions.set(belonging.uid, nameSubscription);

            const locationSubscription = belonging.location
                .pipe(distinctUntilChanged(isEqual))
                .subscribe(
                    location =>
                        this.showOnMapSubject.next(
                            new ObjectCollectionUpdate({
                                changed: [
                                    {
                                        index: index,
                                        elementChange: {
                                            latitude: location.latitude,
                                            longitude: location.longitude
                                        }
                                    }
                                ]
                            })
                        ),
                    error => this.logger.warn(error, true)
                );
            this.locationSubscriptions.set(belonging.uid, locationSubscription);
        });
    }
}
