import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// containers
import { KSMainComponent } from './containers/main/main.component';


const routes: Routes = [
  { path: '', component: KSMainComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KitchenSinkRoutingModule { }
