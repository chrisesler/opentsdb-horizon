import { DashboardStateModel } from './dashboard.state';

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

export class UpdateWidgetsLayout {
    static readonly type = '[Dashboard] Update Wiget Layout';
    constructor(public readonly payload: any) {}
}

export class SetViewEditMode {
    static readonly type = '[Dashboard] Set ViewEdit Mode';
    constructor(public readonly payload: any) {}
}

export class GetQueryData {
    static readonly type = '[Dashboard] Get Query Data';
    constructor(public readonly widgetid: string, public readonly query: any) {}
}

export class RemoveWidget {
    static readonly type = '[Dashboard] Remove Widget';
    constructor(public readonly payload: any) {}
}

export class AddWidget {
    static readonly type = '[Dashboard] Add Widget';
    constructor(public readonly payload: any) {}
}

export type DashboardActions = LoadDashboard 
                                | LoadDashboardSuccess 
                                | LoadDashboardFail
                                | UpdateWidgetsLayout
                                | SetViewEditMode
                                | GetQueryData
                                | RemoveWidget
                                | AddWidget;