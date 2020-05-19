import LifecycleObservable from "./LifecycleObservable";
import { Subscription, Subject, Observable } from "rxjs";

let testValue = 0;
const sourceObservableSubject = new Subject<number>();
// Cannot use 'startWith' operator because the source observable may not emit
// its first value if fired too soon after subscription.
//
const sourceObservable = new Observable(subscriber => {
    sourceObservableSubject.subscribe(subscriber);
    subscriber.next(testValue);
});
const initCallbackExecuted = new Subject<void>();
const initCallback = async (): Promise<void> => {
    testValue += 1;
    initCallbackExecuted.next();
};
const deinitCallbackExecuted = new Subject<void>();
const deinitCallback = async (): Promise<void> => {
    testValue -= 1;
    deinitCallbackExecuted.next();
};
const lifecycleObservable = LifecycleObservable(
    sourceObservable,
    initCallback,
    deinitCallback
);
const subscriptions: Subscription[] = [];

test("init callback executes upon first subscription", async (): Promise<
    void
> => {
    expect.assertions(1);
    await new Promise(resolve => {
        initCallbackExecuted.subscribe(resolve);
        subscriptions.push(lifecycleObservable.subscribe());
    });
    expect(testValue).toBe(1);
});

test("deinit is executed after there are no subscribers", async (): Promise<
    void
> => {
    expect.assertions(2);
    expect(testValue).toBe(1);
    await new Promise(resolve => {
        deinitCallbackExecuted.subscribe(resolve);
        subscriptions.forEach(() => subscriptions.shift()?.unsubscribe());
    });
    expect(testValue).toBe(0);
});

test("init callback executes again upon first subscription", async (): Promise<
    void
> => {
    expect.assertions(1);
    await new Promise(resolve => {
        initCallbackExecuted.subscribe(resolve);
        subscriptions.push(lifecycleObservable.subscribe());
    });
    expect(testValue).toBe(1);
    subscriptions.forEach(() => subscriptions.shift()?.unsubscribe());
});

test("source Observable only emits after init callback completes", async (): Promise<
    void
> => {
    expect.assertions(1);
    const executions: string[] = [];
    await new Promise(resolve => {
        initCallbackExecuted.subscribe(() => {
            executions.push("initCallback");
            if (executions.length === 2) {
                resolve();
            }
        });
        subscriptions.push(
            lifecycleObservable.subscribe(() => {
                executions.push("observable");
                if (executions.length === 2) {
                    resolve();
                }
            })
        );
    });
    expect(executions[0]).toBe("initCallback");
    subscriptions.forEach(() => subscriptions.shift()?.unsubscribe());
});

test("two subscribers receive emitted values", async (): Promise<void> => {
    expect.assertions(4);
    sourceObservableSubject.next(3);
    sourceObservableSubject.next(4);
    await new Promise(resolve => {
        let firstSubscriptionEmitCount = 0;
        subscriptions.push(
            lifecycleObservable.subscribe(value => {
                firstSubscriptionEmitCount += 1;
                switch (firstSubscriptionEmitCount) {
                    case 1:
                        expect(value).toBe(1);
                        break;
                    case 2:
                        expect(value).toBe(6);
                        break;
                }
            })
        );
        let secondSubscriptionEmitCount = 0;
        subscriptions.push(
            lifecycleObservable.subscribe(value => {
                secondSubscriptionEmitCount += 1;
                switch (secondSubscriptionEmitCount) {
                    case 1:
                        expect(value).toBe(1);
                        sourceObservableSubject.next(6);
                        break;
                    case 2:
                        expect(value).toBe(6);
                        resolve();
                        break;
                }
            })
        );
        sourceObservableSubject.next(5);
    });
});
