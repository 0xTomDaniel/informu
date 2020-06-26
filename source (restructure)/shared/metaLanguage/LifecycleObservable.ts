import { Observable, defer, concat, NEVER, of } from "rxjs";
import { finalize, shareReplay, mergeMap } from "rxjs/operators";

/**
 * @function LifecycleObservable
 * @description Executes initialization callback upon first subscription.
 *  Subscribes to source Observable after initialization callback completes.
 *  When there are no more subscriptions, the deinitialization callback is
 *  executed. Initialization callback is executed again if another subscription
 *  occurs after there are zero subscribers.
 * @param {Observable<T>} source - source Observable.
 * @param {() => Promise<void>} init - optional initialization callback.
 * @param {() => void} init - optional deinitialization callback.
 * @returns {Observable<T>}
 */
const LifecycleObservable = <T>(
    source: Observable<T>,
    init?: () => Promise<void>,
    deinit?: () => void
): Observable<T> =>
    defer(() => {
        const firstObservable = init != null ? init() : of(undefined);
        return concat(firstObservable, NEVER);
    }).pipe(
        finalize(() => deinit?.()),
        shareReplay({ refCount: true, bufferSize: 1 }),
        mergeMap(() => source)
    );

export default LifecycleObservable;
