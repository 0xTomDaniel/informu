export interface Belonging {
    uid: string;
    name: string;
    safeStatusColor: string;
    lastSeen: string;
}

export interface HomeState {

    showEmptyBelongings: boolean;
    showActivityIndicator: boolean;
    belongings: Belonging[];
}

export class HomeViewModel {

    state: HomeState = new Proxy({
        showEmptyBelongings: true,
        showActivityIndicator: false,
        belongings: [],
    }, HomeViewModel.handler(this.triggerDidUpdate.bind(this)));

    private onDidUpdateCallback?: (key: string, value: any) => void;
    private onNavigateToAddMuTagCallback?: () => void;
    private onShowLogoutCompleteCallback?: () => void;

    onDidUpdate(callback?: (key: string, value: any) => void): void {
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

    private triggerDidUpdate(key: string, value: any): void {
        this.onDidUpdateCallback != null && this.onDidUpdateCallback(key, value);
    }

    private static handler(onDidUpdate: (key: string, value: any) => void): ProxyHandler<HomeState> {
        return {
            get(target: { [key: string]: any }, key: string): any {
                if (key === '__Proxy') {
                    return true;
                }

                if (!(key in target)) {
                    return;
                }

                const value = target[key];

                if (typeof value === 'undefined') {
                    return;
                }

                if (!value.__Proxy && typeof value === 'object') {
                    target[key] = new Proxy(value, HomeViewModel.handler(onDidUpdate));
                }

                return target[key];
            },
            set(target: { [key: string]: any }, key: string, value): boolean {
                target[key] = value;
                onDidUpdate(key, value);
                return true;
            },
        };
    }
}
