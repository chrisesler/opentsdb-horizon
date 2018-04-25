import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KitchenSinkRoutingModule } from './kitchen-sink-routing.module';

// Containers
import { KSMainComponent } from './containers/main/main.component';

// Components
import { KSNavbarComponent } from './components/navbar/navbar.component';

@NgModule({
  imports: [
    CommonModule,
    KitchenSinkRoutingModule
  ],
  declarations: [KSMainComponent, KSNavbarComponent]
})
export class KitchenSinkModule { }
