import { Millisecond } from "../../shared/metaLanguage/Types";

export default interface BackgroundTaskPort {
    enqueueRepeatedTask(
        minimumInterval: Millisecond,
        task: () => Promise<void>
    ): string;
    dequeueRepeatedTask(taskUid: string): void;
}
