import BelongingMapViewModel, {
    BelongingFeatureProperties
} from "./BelongingMapViewModel";
import BelongingMapInteractor, {
    BelongingLocation,
    BelongingLocationDelta
} from "../BelongingMapInteractor";
import { Subject, Subscription } from "rxjs";
import ObjectCollectionUpdate from "../../../shared/metaLanguage/ObjectCollectionUpdate";
import { FeatureCollection, Point } from "geojson";
import { cloneDeep } from "lodash";

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
/*const roundCoordinates = (
    update: FeatureCollection<Point, BelongingFeatureProperties>
) => {
    const updateClone = cloneDeep(update);
    updateClone.features.forEach(feature => {
        const longitude = parseFloat(
            feature.geometry.coordinates[0].toFixed(12)
        );
        const latitude = parseFloat(
            feature.geometry.coordinates[1].toFixed(12)
        );
        feature.geometry.coordinates = [longitude, latitude];
    });
    return updateClone;
};*/

test("show all belongings", async (): Promise<void> => {
    expect.assertions(6);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                // Using precision of four decimal places because randomness is
                // added to latitude and longitude.
                expect(update.features[0].geometry.coordinates[0]).toBeCloseTo(
                    -105.09686516468388,
                    4
                );
                expect(update.features[0].geometry.coordinates[1]).toBeCloseTo(
                    39.836557861962184,
                    4
                );
                expect(update.features[0].properties.name).toBe("Keys");
                expect(update.features[1].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[1].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[1].properties.name).toBe("Wallet");
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
    expect.assertions(6);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update.features[0].geometry.coordinates[0]).toBeCloseTo(
                    -105.09686516468381,
                    4
                );
                expect(update.features[0].geometry.coordinates[1]).toBeCloseTo(
                    39.836557861962184,
                    4
                );
                expect(update.features[0].properties.name).toBe("Keys");
                expect(update.features[1].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[1].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[1].properties.name).toBe("Bag");
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
    expect.assertions(12);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update.features[0].geometry.coordinates[0]).toBeCloseTo(
                    -105.09686516468381,
                    4
                );
                expect(update.features[0].geometry.coordinates[1]).toBeCloseTo(
                    39.836557861962184,
                    4
                );
                expect(update.features[0].properties.name).toBe("Keys");
                expect(update.features[1].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[1].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[1].properties.name).toBe("Laptop");
                expect(update.features[2].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[2].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[2].properties.name).toBe("Bag");
                expect(update.features[3].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[3].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[3].properties.name).toBe("Wallet");
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
    expect.assertions(6);
    let subscription: Subscription | undefined;
    await new Promise(resolve => {
        subscription = belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                expect(update.features[0].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[0].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[0].properties.name).toBe("Laptop");
                expect(update.features[1].geometry.coordinates[0]).toBeCloseTo(
                    -105.06733748256252,
                    4
                );
                expect(update.features[1].geometry.coordinates[1]).toBeCloseTo(
                    39.80963962521709,
                    4
                );
                expect(update.features[1].properties.name).toBe("Wallet");
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
