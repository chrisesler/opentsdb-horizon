import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { DashboardActions, DashboardActionTypes } from './dashboard.actions';

@Injectable()
export class DashboardEffects {

  @Effect()
  effect$ = this.actions$.ofType(DashboardActionTypes.DashboardAction);

  constructor(private actions$: Actions) {}
}
