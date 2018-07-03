import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// containers
import { DashboardComponent } from './containers/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' }, // rediect to landing page path
  { path: ':dbid', component: DashboardComponent }, // dbid === _newdb_ mean new dashboard
  { path: ':dbid/:wid', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
