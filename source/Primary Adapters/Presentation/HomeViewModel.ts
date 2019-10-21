import Theme from './Theme';

export interface Belonging {
    uid: string;
    name: string;
    safeStatusColor: string;
    lastSeen: string;
}

export interface HomeState {

    //showAddMuTagTooltip: boolean;
    showEmptyBelongings: boolean;
    showActivityIndicator: boolean;
    belongings: Belonging[];
}

export class HomeViewModel implements HomeState {

    //private _showAddMuTagTooltip = true;
    private _showEmptyBelongings = true;
    private _showActivityIndicator = false;
    private _belongings: Belonging[] = [];
        /*[
            {
                uid: '1',
                name: 'Keys',
                safeStatusColor: Theme.Color.Green,
                lastSeen: 'Just now',
            },
            {
                uid: '2',
                name: 'Laptop',
                safeStatusColor: Theme.Color.Error,
                lastSeen: '5h ago',
            },
            {
                uid: '3',
                name: 'Bag',
                safeStatusColor: Theme.Color.Green,
                lastSeen: 'Just now',
            },
            {
                uid: '4',
                name: 'Wallet',
                safeStatusColor: Theme.Color.Green,
                lastSeen: 'Just now',
            },
            {
                uid: '5',
                name: 'Wallet',
                safeStatusColor: Theme.Color.Green,
                lastSeen: 'Just now',
            },
            {
                uid: '6',
                name: 'Wallet',
                safeStatusColor: Theme.Color.Green,
                lastSeen: 'Just now',
            },
        ];*/

    /*get showAddMuTagTooltip(): boolean {
        return this._showAddMuTagTooltip;
    }

    set showAddMuTagTooltip(newValue: boolean) {
        this._showAddMuTagTooltip = newValue;
        this.triggerDidUpdate({ showAddMuTagTooltip: newValue });
    }*/

    get showEmptyBelongings(): boolean {
        return this._showEmptyBelongings;
    }

    set showEmptyBelongings(newValue: boolean) {
        this._showEmptyBelongings = newValue;
        this.triggerDidUpdate({ showEmptyBelongings: newValue });
    }

    get showActivityIndicator(): boolean {
        return this._showActivityIndicator;
    }

    set showActivityIndicator(newValue: boolean) {
        this._showActivityIndicator = newValue;
        this.triggerDidUpdate({ showActivityIndicator: newValue });
    }

    get belongings(): Belonging[] {
        return this._belongings;
    }

    set belongings(newValue: Belonging[]) {
        this._belongings = newValue;
        this.triggerDidUpdate({ belongings: newValue });
    }

    private onDidUpdateCallback?: (change: object) => void;
    private onNavigateToAddMuTagCallback?: () => void;
    private onShowLogoutCompleteCallback?: () => void;

    onDidUpdate(callback?: (change: object) => void): void {
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

    private triggerDidUpdate(change: object): void {
        if (this.onDidUpdateCallback != null) {
            this.onDidUpdateCallback(change);
        }
    }
}
