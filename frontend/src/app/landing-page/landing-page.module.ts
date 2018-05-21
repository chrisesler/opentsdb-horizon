import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../shared/modules/material/material.module';

import { LandingPageRoutingModule } from './landing-page-routing.module';

// containers
import { LandingPageMainComponent } from './containers/main/main.component';

// components
import { LandingPageHomeComponent } from './components/home/home.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    LandingPageRoutingModule
  ],
  declarations: [
    LandingPageMainComponent,
    LandingPageHomeComponent
  ]
})
export class LandingPageModule { }
