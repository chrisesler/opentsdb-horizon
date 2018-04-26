import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KitchenSinkRoutingModule } from './kitchen-sink-routing.module';

// Containers
import { KSMainComponent } from './containers/main/main.component';

// Components

@NgModule({
  imports: [
    CommonModule,
    KitchenSinkRoutingModule
  ],
  declarations: [KSMainComponent]
})
export class KitchenSinkModule { }
