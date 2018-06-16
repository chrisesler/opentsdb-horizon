import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../shared/modules/material/material.module';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';
import { LandingPageRoutingModule } from './landing-page-routing.module';

// containers
import { LandingPageComponent } from './containers/landing-page/landing-page.component';

// components


@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    SharedcomponentsModule,
    LandingPageRoutingModule
  ],
  declarations: [
    LandingPageComponent
  ]
})
export class LandingPageModule { }
