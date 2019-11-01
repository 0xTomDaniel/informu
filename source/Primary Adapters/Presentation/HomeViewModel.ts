export interface BelongingViewData {
    uid: string;
    name: string;
    safeStatusColor: string;
    lastSeen: string;
}

export interface HomeState {

    showEmptyBelongings: boolean;
    showActivityIndicator: boolean;
    belongings: BelongingViewData[];
}

export class HomeViewModel {

    state: HomeState = new Proxy({
        showEmptyBelongings: true,
        showActivityIndicator: false,
        belongings: [],
    }, HomeViewModel.handler(this.triggerDidUpdate.bind(this)));

    private onDidUpdateCallback?: (newState: HomeState) => void;
    private onNavigateToAddMuTagCallback?: () => void;
    private onShowLogoutCompleteCallback?: () => void;

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
        const newState = Object.assign({}, this.state);
        this.onDidUpdateCallback != null && this.onDidUpdateCallback(newState);
    }

    private static handler(triggerDidUpdate: () => void): ProxyHandler<HomeState> {
        return {
            get(target: { [key: string]: any }, key: string, receiver): any {
                if (key === '__Proxy') {
                    return true;
                }

                if (!(key in target)) {
                    return;
                }

                const value = Reflect.get(target, key, receiver);

                if (typeof value === 'undefined') {
                    return;
                }

                if (!value.__Proxy && typeof value === 'object') {
                    const proxyValue = new Proxy(value, HomeViewModel.handler(triggerDidUpdate));
                    Reflect.set(target, key, proxyValue, receiver);
                }

                return target[key];
            },
            set(target: { [key: string]: any }, key: string, value, receiver): boolean {
                Reflect.set(target, key, value, receiver);
                if (Array.isArray(target) && key === 'length') {
                    return true;
                }
                triggerDidUpdate();
                return true;
            },
        };
    }
}
