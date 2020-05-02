import BelongingMapViewModel from "./BelongingMapViewModel";
import BelongingMapInteractor, {
    BelongingLocation,
    BelongingLocationDelta
} from "../BelongingMapInteractor";
import { Subject, Subscription } from "rxjs";
import CollectionUpdate from "../../../shared/metaLanguage/CollectionUpdate";

const belongingMapInteractorShowOnMapSubject = new Subject<
    CollectionUpdate<BelongingLocation, BelongingLocationDelta>
>();
const belongingMapInteractorShowOnMap = belongingMapInteractorShowOnMapSubject.asObservable();
const BelongingMapInteractorMock = jest.fn<BelongingMapInteractor, any>(
    (): BelongingMapInteractor => ({
        showOnMap: belongingMapInteractorShowOnMap,
        open: jest.fn()
    })
);
const belongingMapInteractorMock = BelongingMapInteractorMock();
const belongingMapViewModel = new BelongingMapViewModel(
    belongingMapInteractorMock
);

test("show all belongings", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual([
                    {
                        latitude: 39.836557861962184,
                        longitude: -105.09686516468388,
                        name: "Keys"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Wallet"
                    }
                ]);
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next({
            added: [
                {
                    index: 0,
                    element: {
                        latitude: 39.836557861962184,
                        longitude: -105.09686516468388,
                        name: "Keys"
                    }
                },
                {
                    index: 1,
                    element: {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Wallet"
                    }
                }
            ]
        });
    });
    subscription?.unsubscribe();
});

test("show belonging change", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual([
                    {
                        latitude: 39.836557861962184,
                        longitude: -105.09686516468381,
                        name: "Keys"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Bag"
                    }
                ]);
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next({
            changed: [
                {
                    index: 0,
                    elementChange: {
                        longitude: -105.09686516468381
                    }
                },
                {
                    index: 1,
                    elementChange: {
                        name: "Bag"
                    }
                }
            ]
        });
    });
    subscription?.unsubscribe();
});

test("show added belongings", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual([
                    {
                        latitude: 39.836557861962184,
                        longitude: -105.09686516468381,
                        name: "Keys"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Laptop"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Bag"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Wallet"
                    }
                ]);
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next({
            added: [
                {
                    index: 1,
                    element: {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Laptop"
                    }
                },
                {
                    index: 3,
                    element: {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Wallet"
                    }
                }
            ]
        });
    });
    subscription?.unsubscribe();
});

test("remove belonging", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual([
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Laptop"
                    },
                    {
                        latitude: 39.80963962521709,
                        longitude: -105.06733748256252,
                        name: "Wallet"
                    }
                ]);
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next({
            removed: [
                {
                    index: 2
                },
                {
                    index: 0
                }
            ]
        });
    });
    subscription?.unsubscribe();
});
