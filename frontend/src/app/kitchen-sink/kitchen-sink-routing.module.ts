import { NgModule } from '@angular/core';

import { Routes, RouterModule } from '@angular/router';

// containers
import { KSMainComponent } from './containers/main/main.component';

import { KSHomeComponent } from './containers/home/home.component';


const routes: Routes = [{
  path: '',
  component: KSMainComponent,
  children: [{
      path: '',
      redirectTo: 'home',
      pathMatch: 'full'
    },
    {
      path: 'home',
      component: KSHomeComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KitchenSinkRoutingModule {}
