import _ from "lodash";

export interface BelongingViewData {
    readonly uid: string;
    readonly name: string;
    readonly safeStatusColor: string;
    readonly lastSeen: string;
    readonly address: string;
}

export interface BelongingViewDataDelta {
    readonly uid: string;
    readonly name?: string;
    readonly safeStatusColor?: string;
    readonly lastSeen?: string;
    readonly address?: string;
}

export interface BelongingDashboardState {
    readonly showEmptyBelongings: boolean;
    readonly showActivityIndicator: boolean;
    readonly errorDescription: string;
    readonly detailedErrorDescription: string;
    readonly isErrorVisible: boolean;
    readonly belongings: BelongingViewData[];
}

export interface BelongingDashboardStateDelta {
    readonly showEmptyBelongings?: boolean;
    readonly showActivityIndicator?: boolean;
    readonly errorDescription?: string;
    readonly detailedErrorDescription?: string;
    readonly isErrorVisible?: boolean;
    readonly belongings?: BelongingViewDataDelta[];
}

export class BelongingDashboardViewModel {
    private _state: BelongingDashboardState = {
        showEmptyBelongings: true,
        showActivityIndicator: false,
        errorDescription: "",
        detailedErrorDescription: "",
        isErrorVisible: false,
        belongings: []
    };

    get state(): BelongingDashboardState {
        return this._state;
    }

    private onDidUpdateCallback?: (newState: BelongingDashboardState) => void;
    private onNavigateToAddMuTagCallback?: () => void;
    private onShowLogoutCompleteCallback?: () => void;

    updateState(delta: BelongingDashboardStateDelta): void {
        const oldState = _.cloneDeep(this._state);

        //DEBUG
        //console.log(`updateState() - delta: ${JSON.stringify(delta)}`);
        //console.log(`updateState() - oldState: ${JSON.stringify(oldState)}`);

        _.mergeWith(this._state, delta, (destValue, deltaValue):
            | any[]
            | undefined => {
            if (_.isArray(destValue)) {
                const merged = _.values(
                    _.merge(
                        _.keyBy(destValue, "uid"),
                        _.keyBy(deltaValue, "uid")
                    )
                );
                return _.intersectionBy(merged, deltaValue, "uid");
            }
        });

        if (!_.isEqual(this._state, oldState)) {
            //DEBUG
            /*console.log(
                `updateState() - this._state: ${JSON.stringify(this._state)}`
            );*/

            this.triggerDidUpdate();
        }
    }

    onDidUpdate(callback?: (newState: BelongingDashboardState) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToAddMuTag(callback?: () => void): void {
        this.onNavigateToAddMuTagCallback = callback;
    }

    navigateToAddMuTag(): void {
        this.onNavigateToAddMuTagCallback?.();
    }

    onShowLogoutComplete(callback?: () => void): void {
        this.onShowLogoutCompleteCallback = callback;
    }

    showLogoutComplete(): void {
        this.onShowLogoutCompleteCallback?.();
    }

    private triggerDidUpdate(): void {
        const newState = _.cloneDeep(this._state);
        this.onDidUpdateCallback?.(newState);
    }
}
