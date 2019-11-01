export interface DashboardBelonging {
    readonly uid: string;
    readonly name: string;
    readonly isSafe: boolean;
    readonly lastSeen: Date;
}

export interface DashboardBelongingUpdate {
    readonly uid: string;
    readonly name?: string;
    readonly isSafe?: boolean;
    readonly lastSeen?: Date;
}

export interface BelongingDashboardOutput {

    showAll(belongings: DashboardBelonging[]): void;
    showNone(): void;
    add(belonging: DashboardBelonging): void;
    update(belonging: DashboardBelongingUpdate): void;
    remove(belongingUID: string): void;
}
