import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'ks', pathMatch: 'full' },
  //{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  //{ path: 'adhoc', loadChildren: 'app/adhoc/adhoc.module#AdhocModule' },
  //{ path: 'admin', loadChildren: 'app/admin/admin.module#AdminModule' },
  //{ path: 'dashboard', loadChildren: 'app/dashboard/dashboard.module#DashboardModule' },
  { path: 'ks', loadChildren: 'app/kitchen-sink/kitchen-sink.module#KitchenSinkModule' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true})],
    exports: [RouterModule],
    providers: []
})
export class AppRoutingModule { }
