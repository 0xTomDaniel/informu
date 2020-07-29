import BackgroundFetch, {
    BackgroundFetchConfig,
    BackgroundFetchStatus
} from "react-native-background-fetch";

export interface BackgroundFetchProxy {
    configure(
        config: BackgroundFetchConfig,
        callback: (taskId: string) => void,
        failure?: (status: BackgroundFetchStatus) => void
    ): void;
    finish(taskId?: string): void;
}

export default class BackgroundFetchProxyImpl implements BackgroundFetchProxy {
    private static _instance: BackgroundFetchProxy | undefined;
    static get instance(): BackgroundFetchProxy {
        return this._instance ?? (this._instance = new this());
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    configure(
        config: BackgroundFetchConfig,
        callback: (taskId: string) => void,
        failure?: (status: BackgroundFetchStatus) => void
    ): void {
        BackgroundFetch.configure(config, callback, failure);
    }

    finish(taskId?: string): void {
        BackgroundFetch.finish(taskId);
    }
}
