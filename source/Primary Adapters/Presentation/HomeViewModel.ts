import _ from 'lodash';

export interface BelongingViewData {

    readonly uid: string;
    readonly name: string;
    readonly safeStatusColor: string;
    readonly lastSeen: string;
}

export interface BelongingViewDataDelta {

    readonly uid: string;
    readonly name?: string;
    readonly safeStatusColor?: string;
    readonly lastSeen?: string;
}

export interface HomeState {

    readonly showEmptyBelongings: boolean;
    readonly showActivityIndicator: boolean;
    readonly errorDescription: string;
    readonly isErrorVisible: boolean;
    readonly belongings: BelongingViewData[];
}

export interface HomeStateDelta {

    readonly showEmptyBelongings?: boolean;
    readonly showActivityIndicator?: boolean;
    readonly errorDescription?: string;
    readonly isErrorVisible?: boolean;
    readonly belongings?: BelongingViewDataDelta[];
}

export class HomeViewModel {

    private _state: HomeState = {
        showEmptyBelongings: true,
        showActivityIndicator: false,
        errorDescription: '',
        isErrorVisible: false,
        belongings: [],
    }

    get state(): HomeState {
        return this._state;
    }

    private onDidUpdateCallback?: (newState: HomeState) => void;
    private onNavigateToAddMuTagCallback?: () => void;
    private onShowLogoutCompleteCallback?: () => void;

    updateState(delta: HomeStateDelta): void {
        const oldState = _.cloneDeep(this._state);
        _.mergeWith(
            this._state,
            delta,
            (destValue, deltaValue): any[] | undefined => {
                if (_.isArray(destValue)) {
                    const merged = _.values(_.merge(
                        _.keyBy(destValue, 'uid'), _.keyBy(deltaValue, 'uid')
                    ));
                    return _.intersectionBy(merged, deltaValue, 'uid');
                }
            }
        );
        if (!_.isEqual(this._state, oldState)) {
            this.triggerDidUpdate();
        }
    }

    onDidUpdate(callback?: (newState: HomeState) => void): void {
        this.onDidUpdateCallback = callback;
    }

    onNavigateToAddMuTag(callback?: () => void): void {
        this.onNavigateToAddMuTagCallback = callback;
    }

    navigateToAddMuTag(): void {
        if (this.onNavigateToAddMuTagCallback != null) {
            this.onNavigateToAddMuTagCallback();
        }
    }

    onShowLogoutComplete(callback?: () => void): void {
        this.onShowLogoutCompleteCallback = callback;
    }

    showLogoutComplete(): void {
        if (this.onShowLogoutCompleteCallback != null) {
            this.onShowLogoutCompleteCallback();
        }
    }

    private triggerDidUpdate(): void {
        const newState = _.cloneDeep(this._state);
        this.onDidUpdateCallback != null && this.onDidUpdateCallback(newState);
    }
}
