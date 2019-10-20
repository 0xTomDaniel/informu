export interface Belonging {
    name: string;
    isSafe: boolean;
    lastSeen: string;
}

export interface HomeState {

    //showAddMuTagTooltip: boolean;
    showActivityIndicator: boolean;
    belongings: Belonging[];
}

export class HomeViewModel implements HomeState {

    //private _showAddMuTagTooltip = true;
    private _showActivityIndicator = false;
    private _belongings = [
        {
            name: 'Keys',
            isSafe: true,
            lastSeen: 'Just now',
        },
        {
            name: 'Laptop',
            isSafe: false,
            lastSeen: '5h ago',
        },
        {
            name: 'Bag',
            isSafe: true,
            lastSeen: 'Just now',
        },
        {
            name: 'Wallet',
            isSafe: true,
            lastSeen: 'Just now',
        },
        {
            name: 'Wallet',
            isSafe: true,
            lastSeen: 'Just now',
        },
    ];

    /*get showAddMuTagTooltip(): boolean {
        return this._showAddMuTagTooltip;
    }

    set showAddMuTagTooltip(newValue: boolean) {
        this._showAddMuTagTooltip = newValue;
        this.triggerDidUpdate({ showAddMuTagTooltip: newValue });
    }*/

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
