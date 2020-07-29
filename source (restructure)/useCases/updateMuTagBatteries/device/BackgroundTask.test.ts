import { BackgroundFetchProxy } from "./BackgroundFetchProxy";
import BackgroundTask from "./BackgroundTask";
import { Millisecond } from "../../../shared/metaLanguage/Types";
import Logger from "../../../shared/metaLanguage/Logger";
import EventTracker from "../../../shared/metaLanguage/EventTracker";
import { BackgroundFetchConfig } from "react-native-background-fetch";
import { Subject } from "rxjs";
import { filter, take } from "rxjs/operators";
import { fakeSchedulers } from "rxjs-marbles/jest";

const EventTrackerMock = jest.fn<EventTracker, any>(
    (): EventTracker => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setUser: jest.fn(),
        removeUser: jest.fn()
    })
);
const eventTrackerMock = new EventTrackerMock();
Logger.createInstance(eventTrackerMock);

let interval: NodeJS.Timeout | undefined;
const BackgroundFetchProxyMock = jest.fn<BackgroundFetchProxy, any>(
    (): BackgroundFetchProxy => ({
        configure: (
            _config: BackgroundFetchConfig,
            callback: (taskId: string) => void
        ) => {
            interval = setInterval(() => callback("taskId"), 1000);
        },
        finish: jest.fn()
    })
);
const backgroundFetchProxyMock = new BackgroundFetchProxyMock();
const backgroundTask = new BackgroundTask(backgroundFetchProxyMock);
enum Task {
    One,
    Two,
    Three
}
const notifier = new Subject<Task>();
const tasks = [
    {
        task: jest.fn().mockImplementation(async () => notifier.next(Task.One)),
        interval: 5000 as Millisecond
    },
    {
        task: jest.fn().mockImplementation(async () => notifier.next(Task.Two)),
        interval: 10000 as Millisecond
    },
    {
        task: jest
            .fn()
            .mockImplementation(async () => notifier.next(Task.Three)),
        interval: 20000 as Millisecond
    }
];
let taskUid01: string;

beforeAll(() => {
    jest.useFakeTimers("modern");
    taskUid01 = backgroundTask.enqueueRepeatedTask(
        tasks[0].interval,
        tasks[0].task
    );
    backgroundTask.enqueueRepeatedTask(tasks[1].interval, tasks[1].task);
    backgroundTask.enqueueRepeatedTask(tasks[2].interval, tasks[2].task);
});

afterAll(() => {
    if (interval != null) {
        clearInterval(interval);
    }
    jest.useRealTimers();
});

test("execute any tasks upon first background fetch", async () => {
    const promise = notifier
        .pipe(
            filter(task => task === Task.Three),
            take(1)
        )
        .toPromise();
    jest.advanceTimersByTime(1000);
    await promise;
    expect(tasks[0].task).toHaveBeenCalledTimes(1);
    expect(tasks[1].task).toHaveBeenCalledTimes(1);
    expect(tasks[2].task).toHaveBeenCalledTimes(1);
});

test(
    "repeatedly execute tasks when defined intervals have elapsed",
    fakeSchedulers(async advance => {
        expect.assertions(9);
        let promise = notifier
            .pipe(
                filter(task => task === Task.One),
                take(1)
            )
            .toPromise();
        advance(5000);
        await promise;
        expect(tasks[0].task).toHaveBeenCalledTimes(2);
        expect(tasks[1].task).toHaveBeenCalledTimes(1);
        expect(tasks[2].task).toHaveBeenCalledTimes(1);
        promise = notifier
            .pipe(
                filter(task => task === Task.Two),
                take(1)
            )
            .toPromise();
        advance(5000);
        await promise;
        expect(tasks[0].task).toHaveBeenCalledTimes(3);
        expect(tasks[1].task).toHaveBeenCalledTimes(2);
        expect(tasks[2].task).toHaveBeenCalledTimes(1);
        promise = notifier
            .pipe(
                filter(task => task === Task.One),
                take(1)
            )
            .toPromise();
        advance(5000);
        await promise;
        promise = notifier
            .pipe(
                filter(task => task === Task.Three),
                take(1)
            )
            .toPromise();
        advance(5000);
        await promise;
        expect(tasks[0].task).toHaveBeenCalledTimes(5);
        expect(tasks[1].task).toHaveBeenCalledTimes(3);
        expect(tasks[2].task).toHaveBeenCalledTimes(2);
    })
);

test(
    "stop executing task once dequeued",
    fakeSchedulers(async advance => {
        backgroundTask.dequeueRepeatedTask(taskUid01);
        expect.assertions(2);
        const promise = notifier
            .pipe(
                filter(task => task === Task.Two),
                take(1)
            )
            .toPromise();
        advance(5000);
        advance(5000);
        await promise;
        expect(tasks[0].task).toHaveBeenCalledTimes(5);
        expect(tasks[1].task).toHaveBeenCalledTimes(4);
    })
);
