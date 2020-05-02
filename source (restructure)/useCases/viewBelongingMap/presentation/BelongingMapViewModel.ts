import { Observable } from "rxjs";
import BelongingMapInteractor from "../BelongingMapInteractor";
import { map } from "rxjs/operators";

interface BelongingMarker {
    latitude: number;
    longitude: number;
    name: string;
}

export default class BelongingMapViewModel {
    private readonly belongingMapInteractor: BelongingMapInteractor;
    private readonly belongingMarkers: BelongingMarker[] = [];
    readonly showBelongingMarkers: Observable<BelongingMarker[]>;

    constructor(belongingMapInteractor: BelongingMapInteractor) {
        this.belongingMapInteractor = belongingMapInteractor;
        this.showBelongingMarkers = this.belongingMapInteractor.showOnMap.pipe(
            map(update => {
                update.removed?.forEach(removal =>
                    this.belongingMarkers.splice(removal.index, 1)
                );
                update.added?.forEach(addition =>
                    this.belongingMarkers.splice(
                        addition.index,
                        0,
                        addition.element
                    )
                );
                update.changed?.forEach(change =>
                    Object.entries(change.elementChange).forEach(
                        ([key, value]) => {
                            switch (key) {
                                case "latitude":
                                    this.belongingMarkers[change.index][
                                        key
                                    ] = value;
                                    break;
                                case "longitude":
                                    this.belongingMarkers[change.index][
                                        key
                                    ] = value;
                                    break;
                                case "name":
                                    this.belongingMarkers[change.index][
                                        key
                                    ] = value;
                                    break;
                            }
                        }
                    )
                );
                return this.belongingMarkers;
            }, this)
        );
    }
}
