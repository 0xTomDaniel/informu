import { BehaviorSubject } from "rxjs";
import NavigationPort from "../navigation/NavigationPort";

/*export interface ViewModelUserMessage {
    message: string;
    details?: string;
}*/

type LowPriorityMessageTimeout = 4 | 5 | 6 | 7 | 8 | 9 | 10;

export default abstract class ViewModel<
    N extends string,
    H extends string | undefined = undefined,
    L extends string | undefined = undefined,
    M extends string | undefined = undefined
> {
    readonly showIndeterminateProgress = new BehaviorSubject<boolean>(false);
    readonly highPriorityMessage = new BehaviorSubject<H | undefined>(
        undefined
    );
    readonly lowPriorityMessage = new BehaviorSubject<L | undefined>(undefined);
    readonly showMediumPriorityMessage = new BehaviorSubject<M | undefined>(
        undefined
    );

    constructor(navigation: NavigationPort<N>) {
        this.navigation = navigation;
    }

    protected navigation: NavigationPort<N>;

    protected showLowPriorityMessage(
        message: L,
        timeout: LowPriorityMessageTimeout
    ): void {
        // TODO
    }
}
