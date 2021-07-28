import LifecycleObservable from "./LifecycleObservable";
import { Subscription, Subject, BehaviorSubject } from "rxjs";
import { take, skip } from "rxjs/operators";

const beginStarted = new BehaviorSubject<number>(0);
const beginNotifier = new Subject<void>();
const beginComplete = new BehaviorSubject<number>(0);
const endStarted = new BehaviorSubject<number>(0);
const endNotifier = new Subject<void>();
const endComplete = new BehaviorSubject<number>(0);
const source = new Subject<number>();
const begin = async (): Promise<void> => {
    await new Promise(resolve => {
        beginNotifier
            .pipe(take(1))
            .toPromise()
            .then(resolve);
        beginStarted.next(beginStarted.value + 1);
        source.next(586);
    });
    beginComplete.next(beginComplete.value + 1);
};
const end = async (): Promise<void> => {
    await new Promise(resolve => {
        endNotifier
            .pipe(take(1))
            .toPromise()
            .then(resolve);
        endStarted.next(endStarted.value + 1);
    });
    endComplete.next(endComplete.value + 1);
};

test("begin callback is executed even if end callback doesn't exist", async (): Promise<
    void
> => {
    expect.assertions(1);
    const lifecycleObservable = LifecycleObservable(source, begin);
    await new Promise<void>(resolve => {
        beginComplete
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, resolve);
        lifecycleObservable.subscribe().unsubscribe();
        beginNotifier.next();
    });
    expect(beginComplete.value).toBe(1);
});

test("end callback is executed even if begin doesn't exist", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(1);
    const lifecycleObservable = LifecycleObservable(source, undefined, end);
    await new Promise(resolve => {
        endComplete
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, resolve);
        lifecycleObservable.subscribe().unsubscribe();
        endNotifier.next();
    });
    expect(endComplete.value).toBe(1);
});

const lifecycleObservable = LifecycleObservable(source, begin, end);

test("end callback only runs when there are currently no subscribers after begin callback completes", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(2);
    await new Promise(resolve => {
        endStarted
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, () => {
                endNotifier.next();
            });
        endComplete
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, resolve);
        lifecycleObservable.subscribe().unsubscribe();
        const subscription = lifecycleObservable.subscribe();
        beginNotifier.next();
        expect(endStarted.value).toBe(0);
        subscription.unsubscribe();
    });
    expect(endStarted.value).toBe(1);
});

test("begin callback only executes once per session", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(1);
    await new Promise(resolve => {
        endStarted
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, () => {
                expect(beginComplete.value).toBe(1);
                endNotifier.next();
            });
        endComplete
            .pipe(skip(1), take(1))
            .subscribe(undefined, undefined, resolve);
        lifecycleObservable.subscribe().unsubscribe();
        const subscription = lifecycleObservable.subscribe();
        beginNotifier.next();
        subscription.unsubscribe();
    });
});

test("begin callback only executes after end callback completes", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(2);
    await new Promise(resolve => {
        let subscription: Subscription;
        beginStarted.pipe(skip(1), take(2)).subscribe(count => {
            if (count === 2) {
                expect(endComplete.value).toBe(1);
            }
            beginNotifier.next();
        });
        beginComplete
            .pipe(skip(2), take(1))
            .subscribe(() => subscription.unsubscribe());
        endStarted.pipe(skip(1), take(2)).subscribe(count => {
            if (count === 1) {
                expect(beginComplete.value).toBe(1);
                subscription = lifecycleObservable.subscribe();
            }
            endNotifier.next();
        });
        endComplete
            .pipe(skip(2), take(1))
            .subscribe(undefined, undefined, resolve);
        lifecycleObservable.subscribe().unsubscribe();
    });
});

const subscriptions: Subscription[] = [];

test("begin callback executes only upon first subscription", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(1);
    await new Promise(resolve => {
        subscriptions.push(lifecycleObservable.subscribe());
        lifecycleObservable.subscribe().unsubscribe();
        beginNotifier.next();
        resolve();
    });
    expect(beginStarted.value).toBe(1);
});

test("end callback is executed after there are no subscribers", async (): Promise<
    void
> => {
    expect.assertions(2);
    expect(beginComplete.value).toBe(1);
    await new Promise(resolve => {
        endComplete.pipe(skip(1), take(1)).subscribe(resolve);
        subscriptions.forEach(() => subscriptions.shift()?.unsubscribe());
        beginNotifier.next();
        endNotifier.next();
    });
    expect(endComplete.value).toBe(1);
});

test("begin callback executes again upon first subscription", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(1);
    await new Promise((resolve, reject) => {
        endStarted.pipe(skip(1), take(1)).subscribe(undefined, reject, () => {
            expect(beginComplete.value).toBe(1);
            endNotifier.next();
        });
        endComplete
            .pipe(skip(1), take(1))
            .subscribe(undefined, reject, resolve);
        const subscription = lifecycleObservable.subscribe();
        beginNotifier.next();
        subscription.unsubscribe();
    });
});

test("source observable may be emitted from within begin callback and before begin callback completes", async (): Promise<
    void
> => {
    beginStarted.next(0);
    beginComplete.next(0);
    endStarted.next(0);
    endComplete.next(0);
    expect.assertions(1);
    const executions: string[] = [];
    await new Promise(resolve => {
        endComplete
            .pipe(skip(1), take(1))
            .toPromise()
            .then(() => resolve());
        endStarted
            .pipe(skip(1), take(1))
            .toPromise()
            .then(() => endNotifier.next());
        lifecycleObservable.pipe(take(1)).subscribe(value => {
            executions.push(value.toString());
            executions.push(beginStarted.value.toString());
            executions.push(beginComplete.value.toString());
        });
        beginNotifier.next();
    });
    expect(executions).toEqual(["586", "1", "0"]);
});

test("two subscribers receive emitted values", async (): Promise<void> => {
    expect.assertions(5);
    source.next(3);
    source.next(4);
    await new Promise(resolve => {
        endComplete
            .pipe(skip(1), take(1))
            .toPromise()
            .then(() => resolve());
        endStarted
            .pipe(skip(1), take(1))
            .toPromise()
            .then(() => endNotifier.next());
        let firstSubscriptionEmitCount = 0;
        lifecycleObservable.pipe(take(3)).subscribe(value => {
            firstSubscriptionEmitCount += 1;
            switch (firstSubscriptionEmitCount) {
                case 1:
                    expect(value).toBe(586);
                    break;
                case 2:
                    expect(value).toBe(5);
                    break;
                case 3:
                    expect(value).toBe(6);
                    break;
            }
        });
        beginNotifier.next();
        let secondSubscriptionEmitCount = 0;
        lifecycleObservable.pipe(take(2)).subscribe(value => {
            secondSubscriptionEmitCount += 1;
            switch (secondSubscriptionEmitCount) {
                case 1:
                    expect(value).toBe(5);
                    source.next(6);
                    break;
                case 2:
                    expect(value).toBe(6);
                    break;
            }
        });
        source.next(5);
    });
});
