export interface DashboardBelonging {
    uid: string;
    name: string;
    isSafe: boolean;
    lastSeen: Date;
}

export interface BelongingDashboardOutput {

    showAll(belongings: DashboardBelonging[]): void;
}
