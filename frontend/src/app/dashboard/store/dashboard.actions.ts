import { Action } from '@ngrx/store';

export enum DashboardActionTypes {
  DashboardAction = '[Dashboard] Action'
}

export class Dashboard implements Action {
  readonly type = DashboardActionTypes.DashboardAction;
}

export type DashboardActions = Dashboard;
