import { Action } from '@ngrx/store';
import { DashboardActions, DashboardActionTypes } from './dashboard.actions';

export interface DashboardState {

}

export const initialState: DashboardState = {

};

export function reducer(state = initialState, action: DashboardActions): DashboardState {
  switch (action.type) {

    case DashboardActionTypes.DashboardAction:
      return state;


    default:
      return state;
  }
}
