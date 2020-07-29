import BelongingMapViewModel from "./BelongingMapViewModel";
import BelongingMapInteractor, {
    BelongingLocation,
    BelongingLocationDelta
} from "../BelongingMapInteractor";
import { Subject, Subscription } from "rxjs";
import ObjectCollectionUpdate from "../../../shared/metaLanguage/ObjectCollectionUpdate";

const belongingMapInteractorShowOnMapSubject = new Subject<
    ObjectCollectionUpdate<BelongingLocation, BelongingLocationDelta>
>();
const belongingMapInteractorShowOnMap = belongingMapInteractorShowOnMapSubject.asObservable();
const BelongingMapInteractorMock = jest.fn<BelongingMapInteractor, any>(
    (): BelongingMapInteractor => ({
        showOnMap: belongingMapInteractorShowOnMap
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
                expect(update).toEqual({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.09686516468388,
                                    39.836557861962184
                                ]
                            },
                            properties: {
                                name: "Keys"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Wallet"
                            }
                        }
                    ]
                });
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next(
            new ObjectCollectionUpdate({
                initial: [
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
                ]
            })
        );
    });
    subscription?.unsubscribe();
});

test("show belonging change", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.09686516468381,
                                    39.836557861962184
                                ]
                            },
                            properties: {
                                name: "Keys"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Bag"
                            }
                        }
                    ]
                });
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next(
            new ObjectCollectionUpdate({
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
            })
        );
    });
    subscription?.unsubscribe();
});

test("show added belongings", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.09686516468381,
                                    39.836557861962184
                                ]
                            },
                            properties: {
                                name: "Keys"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Laptop"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Bag"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Wallet"
                            }
                        }
                    ]
                });
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next(
            new ObjectCollectionUpdate({
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
            })
        );
    });
    subscription?.unsubscribe();
});

test("remove belonging", async (): Promise<void> => {
    expect.assertions(1);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update).toEqual({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Laptop"
                            }
                        },
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    -105.06733748256252,
                                    39.80963962521709
                                ]
                            },
                            properties: {
                                name: "Wallet"
                            }
                        }
                    ]
                });
                resolve();
            }
        );
        belongingMapInteractorShowOnMapSubject.next(
            new ObjectCollectionUpdate({
                removed: [
                    {
                        index: 2
                    },
                    {
                        index: 0
                    }
                ]
            })
        );
    });
    subscription?.unsubscribe();
});
