import _ from "lodash";

export interface ObjectCollectionAddition<E> {
    readonly index: number;
    readonly element: E;
}

interface ObjectCollectionRemoval {
    readonly index: number;
}

export interface ObjectCollectionChange<D> {
    readonly index: number;
    readonly elementChange: D;
}

interface ObjectCollectionUpdateData<
    E extends Record<keyof E, unknown>,
    D extends Partial<E>
> {
    readonly initial?: E[];
    readonly added?: ObjectCollectionAddition<E>[];
    readonly removed?: ObjectCollectionRemoval[];
    readonly changed?: ObjectCollectionChange<D>[];
}

export default class ObjectCollectionUpdate<
    E extends Record<keyof E, unknown>,
    D extends Partial<E>
> {
    applyTo(collection?: E[]): E[] {
        const collectionUpdated = _.cloneDeep(this.initial ?? collection) ?? [];
        this.removed?.forEach(removal =>
            collectionUpdated.splice(removal.index, 1)
        );
        this.added?.forEach(addition =>
            collectionUpdated.splice(addition.index, 0, addition.element)
        );
        this.changed?.forEach(change => {
            if (collectionUpdated[change.index] == null) {
                return;
            }
            const elementChange = change.elementChange;
            for (const key in elementChange) {
                (collectionUpdated as any[])[change.index][key] =
                    elementChange[key];
            }
        });
        return collectionUpdated;
    }

    readonly initial?: E[];
    readonly added?: ObjectCollectionAddition<E>[];
    readonly removed?: ObjectCollectionRemoval[];
    readonly changed?: ObjectCollectionChange<D>[];

    constructor(updateData: ObjectCollectionUpdateData<E, D>) {
        this.initial = updateData.initial;
        this.added = updateData.added;
        this.removed = updateData.removed;
        this.changed = updateData.changed;
    }
}
