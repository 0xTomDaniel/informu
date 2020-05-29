import { Observable } from "rxjs";
import BelongingMapInteractor, {
    BelongingLocation
} from "../BelongingMapInteractor";
import { map } from "rxjs/operators";
import { Feature, Point, FeatureCollection } from "geojson";

export interface BelongingFeatureProperties {
    name: string;
}

export default class BelongingMapViewModel {
    private readonly belongingMapInteractor: BelongingMapInteractor;
    private features: Feature<Point, BelongingFeatureProperties>[] = [];
    readonly showBelongingMarkers: Observable<
        FeatureCollection<Point, BelongingFeatureProperties>
    >;

    constructor(belongingMapInteractor: BelongingMapInteractor) {
        this.belongingMapInteractor = belongingMapInteractor;
        this.showBelongingMarkers = this.belongingMapInteractor.showOnMap.pipe(
            map(update => {
                if (update.initial != null) {
                    this.features = update.initial.map(belongingLocation =>
                        this.convertToFeature(belongingLocation)
                    );
                }
                update.removed?.forEach(removal =>
                    this.features.splice(removal.index, 1)
                );
                update.added?.forEach(addition =>
                    this.features.splice(
                        addition.index,
                        0,
                        this.convertToFeature(addition.element)
                    )
                );
                update.changed?.forEach(change =>
                    Object.entries(change.elementChange).forEach(
                        ([key, value]) => {
                            switch (key) {
                                case "latitude":
                                    this.features[
                                        change.index
                                    ].geometry.coordinates[1] = value;
                                    break;
                                case "longitude":
                                    this.features[
                                        change.index
                                    ].geometry.coordinates[0] = value;
                                    break;
                                case "name":
                                    this.features[change.index].properties[
                                        key
                                    ] = value;
                                    break;
                            }
                        }
                    )
                );
                return {
                    type: "FeatureCollection",
                    features: this.features
                };
            }, this)
        );
    }

    convertToFeature(
        belongingLocation: BelongingLocation
    ): Feature<Point, BelongingFeatureProperties> {
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    belongingLocation.longitude,
                    belongingLocation.latitude
                ]
            },
            properties: {
                name: belongingLocation.name
            }
        };
    }
}
