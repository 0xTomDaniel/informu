interface CollectionAddition<T> {
    index: number;
    element: T;
}

interface CollectionRemoval {
    index: number;
}

interface CollectionChange<D> {
    index: number;
    elementChange: D;
}

export default interface CollectionUpdate<T, D> {
    added?: CollectionAddition<T>[];
    removed?: CollectionRemoval[];
    changed?: CollectionChange<D>[];
}
