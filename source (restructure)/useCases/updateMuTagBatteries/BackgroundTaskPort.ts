import { Millisecond } from "../../shared/metaLanguage/Types";

export default interface BackgroundTaskPort {
    queueRepeatedTask(
        minimumInterval: Millisecond,
        task: () => Promise<void>
    ): string;
}
