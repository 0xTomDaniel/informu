import { BehaviorSubject, Observable } from "rxjs";
import NavigationPort from "../navigation/NavigationPort";
import { Range0_100 } from "../metaLanguage/Range0_100";

type LowPriorityMessageTimeoutSeconds = 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProgressIndicatorState = "Indeterminate" | Range0_100 | undefined;

export default abstract class ViewModel<
    R extends string,
    H extends string | undefined = undefined,
    L extends string | undefined = undefined,
    M extends string | undefined = undefined
> {
    readonly highPriorityMessage: Observable<H | undefined>;
    get highPriorityMessageValue(): H | undefined {
        return this._highPriorityMessage.value;
    }
    readonly lowPriorityMessage: Observable<L | undefined>;
    get lowPriorityMessageValue(): L | undefined {
        return this._lowPriorityMessage.value;
    }
    readonly mediumPriorityMessage: Observable<M | undefined>;
    get mediumPriorityMessageValue(): M | undefined {
        return this._mediumPriorityMessage.value;
    }
    readonly progressIndicator: Observable<ProgressIndicatorState>;
    get progressIndicatorValue(): ProgressIndicatorState {
        return this._progressIndicator.value;
    }

    constructor(navigation: NavigationPort<R>) {
        this.highPriorityMessage = this._highPriorityMessage.asObservable();
        this.lowPriorityMessage = this._lowPriorityMessage.asObservable();
        this.mediumPriorityMessage = this._mediumPriorityMessage.asObservable();
        this.navigation = navigation;
        this.progressIndicator = this._progressIndicator.asObservable();
    }

    hideHighPriorityMessage(): void {
        this._highPriorityMessage.next(undefined);
    }

    hideLowPriorityMessage(): void {
        this._lowPriorityMessage.next(undefined);
    }

    hideMediumPriorityMessage(): void {
        this._mediumPriorityMessage.next(undefined);
    }

    protected readonly navigation: NavigationPort<R>;
    protected readonly _showIndeterminateProgress = new BehaviorSubject<
        boolean
    >(false);

    protected hideProgressIndicator(): void {
        this._progressIndicator.next(undefined);
    }

    protected showHighPriorityMessage(message: H): void {
        this._highPriorityMessage.next(message);
    }

    protected showLowPriorityMessage(
        message: L,
        timeout: LowPriorityMessageTimeoutSeconds
    ): void {
        this._lowPriorityMessage.next(message);
        const timeoutMilliseconds = timeout * 1000;
        setTimeout(() => this._lowPriorityMessage.next(undefined), timeoutMilliseconds);
    }

    protected showMediumPriorityMessage(message: M): void {
        this._mediumPriorityMessage.next(message);
    }

    protected showProgressIndicator(
        state: NonNullable<ProgressIndicatorState>
    ): void {
        this._progressIndicator.next(state);
    }

    private readonly _highPriorityMessage = new BehaviorSubject<H | undefined>(
        undefined
    );
    private readonly _lowPriorityMessage = new BehaviorSubject<L | undefined>(
        undefined
    );
    private readonly _mediumPriorityMessage = new BehaviorSubject<
        M | undefined
    >(undefined);
    private readonly _progressIndicator = new BehaviorSubject<
        ProgressIndicatorState
    >(undefined);
}
