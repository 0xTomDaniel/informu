import { Observable, defer, merge, EMPTY, BehaviorSubject } from "rxjs";
import { finalize, share, take, skipWhile } from "rxjs/operators";

/**
 * @function LifecycleObservable
 * @description Executes 'begin' callback only upon first subscription and
 * immediately shares source observable. When there are no more subscriptions,
 * the 'end' callback is executed only after the 'begin' has completed. 'Begin'
 * is executed again if another subscription occurs after there are zero
 * subscribers, and only after 'end' has completed.
 * @param {Observable<T>} source - source observable.
 * @param {() => Promise<void>} begin - optional begin callback.
 * @param {() => Promise<void>} end - optional end callback.
 * @returns {Observable<T>}
 */
const LifecycleObservable = <T>(
    source: Observable<T>,
    begin?: () => Promise<void>,
    end?: () => Promise<void>
): Observable<T> => {
    const hasSessionStarted = new BehaviorSubject<boolean>(false);
    const hasBeginCompleted = new BehaviorSubject<boolean>(false);
    const hasPreviousSessionCompleted = new BehaviorSubject<boolean>(true);
    const hasSubscribers = new BehaviorSubject<boolean>(false);
    return merge(
        source,
        defer(() => {
            hasSubscribers.next(true);
            if (!hasSessionStarted.value) {
                hasSessionStarted.next(true);
                hasPreviousSessionCompleted
                    .pipe(
                        skipWhile(hasCompleted => !hasCompleted),
                        take(1)
                    )
                    .subscribe(undefined, undefined, () => {
                        begin != null
                            ? begin().then(() => hasBeginCompleted.next(true))
                            : hasBeginCompleted.next(true);
                    });
            }
            return EMPTY;
        })
    ).pipe(
        finalize(() => {
            hasSubscribers.next(false);
            hasBeginCompleted
                .pipe(
                    skipWhile(hasCompleted => !hasCompleted),
                    take(1)
                )
                .subscribe(undefined, undefined, () => {
                    if (
                        !hasSubscribers.value &&
                        // prevent multiple 'end' callbacks from running
                        hasSessionStarted.value
                    ) {
                        hasSessionStarted.next(false);
                        hasBeginCompleted.next(false);
                        if (end != null) {
                            hasPreviousSessionCompleted.next(false);
                            end().then(() =>
                                hasPreviousSessionCompleted.next(true)
                            );
                        }
                    }
                });
        }),
        share()
    );
};

export default LifecycleObservable;
