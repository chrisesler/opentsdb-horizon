import { Action } from '@ngrx/store';
import { DashboardActions, DashboardActionTypes } from './dashboard.actions';

export interface State {

}

export const initialState: State = {

};

export function reducer(state = initialState, action: DashboardActions): State {
  switch (action.type) {

    case DashboardActionTypes.DashboardAction:
      return state;


    default:
      return state;
  }
}
