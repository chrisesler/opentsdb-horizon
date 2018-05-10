import { DashboardStateModel } from './dashboard.state'
export class LoadDashboard {
    static readonly type = '[Dashboard] Load Dashboard';
    constructor(public id: string) {}
}

export class LoadDashboardSuccess {
    static readonly type = '[Dashboard] Load Dashboard Success';
    constructor(public readonly payload: DashboardStateModel) {}
}


export class LoadDashboardFail {
    static readonly type = '[Dashboard] Load Dashboard Fail';
    constructor(public readonly error: any) { }
}

export type DashboardActions = LoadDashboard | LoadDashboardSuccess | LoadDashboardFail;