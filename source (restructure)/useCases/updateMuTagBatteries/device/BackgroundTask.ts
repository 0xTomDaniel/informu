import BackgroundTaskPort from "../BackgroundTaskPort";
import { Millisecond } from "../../../shared/metaLanguage/Types";
import Logger from "../../../shared/metaLanguage/Logger";
import { v4 as uuidV4 } from "uuid";
import BackgroundFetchProxy from "./BackgroundFetchProxy";

export default class BackgroundTask implements BackgroundTaskPort {
    private readonly intervals = new Map<string, number>();
    private readonly lastExecutions = new Map<string, Date>();
    private readonly logger = Logger.instance;
    private readonly tasks = new Map<string, () => Promise<void>>();

    constructor(backgroundFetchProxy: BackgroundFetchProxy) {
        backgroundFetchProxy.configure(
            {
                minimumFetchInterval: 15,
                // Android options
                stopOnTerminate: false,
                startOnBoot: true
            },
            async taskId => {
                const backgroundFetchStarted = new Date();
                const queuedTasks = [...this.tasks.entries()]
                    .filter(([uid]) => this.isReadyToExecute(uid))
                    .map(([uid, task]) => {
                        this.lastExecutions.set(uid, backgroundFetchStarted);
                        return task().catch(e => this.logger.error(e, true));
                    });
                await Promise.all(queuedTasks);
                backgroundFetchProxy.finish(taskId);
                const backgroundFetchSecondsElapsed =
                    (backgroundFetchStarted.getTime() - new Date().getTime()) /
                    1000;
                this.logger.log(
                    `Background fetch completed in ${backgroundFetchSecondsElapsed} seconds.`,
                    true
                );
            },
            error => {
                this.logger.error(error, true);
            }
        );
    }

    queueRepeatedTask(
        minimumInterval: Millisecond,
        task: () => Promise<void>
    ): string {
        const uid = uuidV4();
        this.tasks.set(uid, task);
        this.intervals.set(uid, minimumInterval);
        return uid;
    }

    private isReadyToExecute(uid: string): boolean {
        const timeNow = Date.now();
        const lastExecution = this.lastExecutions.get(uid)?.getTime() ?? 0;
        const timeSinceExecution = timeNow - lastExecution;
        const interval = this.intervals.get(uid) ?? 0;
        return timeSinceExecution >= interval;
    }
}
