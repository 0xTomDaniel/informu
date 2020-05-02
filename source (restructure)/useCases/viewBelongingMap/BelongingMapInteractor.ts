import MuTagRepositoryLocalPort from "./MuTagRepositoryLocalPort";
import ProvisionedMuTag, {
    Location
} from "../../../source/Core/Domain/ProvisionedMuTag";
import Logger from "../../shared/metaLanguage/Logger";
import AccountRepositoryLocalPort from "./AccountRepositoryLocalPort";
import { Subscription, Observable, Subject } from "rxjs";
import CollectionUpdate from "../../shared/metaLanguage/CollectionUpdate";
import { take, map } from "rxjs/operators";

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
    open(): Promise<void>;
}

export class BelongingMapInteractorImpl implements BelongingMapInteractor {
    private readonly accountRepoLocal: AccountRepositoryLocalPort;
    private readonly locationSubscriptions = new Map<string, Subscription>();
    private readonly logger = Logger.instance;
    private readonly muTagRepoLocal: MuTagRepositoryLocalPort;
    readonly showOnMap: Observable<
        CollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >;
    private readonly showOnMapCollection: string[] = [];
    private readonly showOnMapSubject: Subject<
        CollectionUpdate<BelongingLocation, BelongingLocationDelta>
    >;

    constructor(
        accountRepoLocal: AccountRepositoryLocalPort,
        muTagRepoLocal: MuTagRepositoryLocalPort
    ) {
        this.accountRepoLocal = accountRepoLocal;
        this.muTagRepoLocal = muTagRepoLocal;
        this.showOnMapSubject = new Subject<
            CollectionUpdate<BelongingLocation, BelongingLocationDelta>
        >();
        this.showOnMap = this.showOnMapSubject.asObservable();
    }

    async open(): Promise<void> {
        const account = await this.accountRepoLocal.get();
        account.muTagsChange.subscribe((change): void => {
            if (change.insertion != null) {
                this.muTagRepoLocal
                    .getByUid(change.insertion)
                    .then(belonging =>
                        this.showLocationOnMap(new Set([belonging]))
                    )
                    .catch(e => this.logger.warn(e, true));
            }

            if (change.deletion != null) {
                const index = this.showOnMapCollection.findIndex(
                    belonging => belonging === change.deletion
                );
                this.showOnMapCollection.splice(index);
                this.showOnMapSubject.next({
                    removed: [{ index: index }]
                });
                this.locationSubscriptions.get(change.deletion)?.unsubscribe();
            }
        });
        const belongings = await this.muTagRepoLocal.getAll();
        this.showLocationOnMap(belongings);
    }

    private showLocationOnMap(belongings: Set<ProvisionedMuTag>): void {
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
        Promise.all(locations)
            .then(results => {
                const belongingLocations = results.map(result => {
                    const index =
                        this.showOnMapCollection.push(result.belonging.uid) - 1;
                    return {
                        index: index,
                        element: {
                            name: result.belonging.name,
                            latitude: result.location.latitude,
                            longitude: result.location.longitude
                        }
                    };
                });
                this.showOnMapSubject.next({
                    added: belongingLocations
                });
            })
            .catch(e => this.logger.warn(e, true));

        belongings.forEach(belonging => {
            const index = this.showOnMapCollection.findIndex(
                element => element === belonging.uid
            );
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
