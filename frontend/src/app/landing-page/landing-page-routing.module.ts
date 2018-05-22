import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// containers
import { LandingPageMainComponent } from './containers/main/main.component';

// components
import { LandingPageHomeComponent } from './components/home/home.component';


const routes: Routes = [{
  path: '',
  component: LandingPageMainComponent,
  children: [{
      path: '',
      redirectTo: 'home',
      pathMatch: 'full'
    },
    {
      path: 'home',
      component: LandingPageHomeComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingPageRoutingModule { }
