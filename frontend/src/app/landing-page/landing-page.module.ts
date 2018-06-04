import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../shared/modules/material/material.module';
import { ThemePickerModule } from '../shared/modules/theme-picker/theme-picker.module';
import { LandingPageRoutingModule } from './landing-page-routing.module';

// containers
import { LandingPageComponent } from './containers/landing-page/landing-page.component';

// components


@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    ThemePickerModule,
    LandingPageRoutingModule
  ],
  declarations: [
    LandingPageComponent
  ]
})
export class LandingPageModule { }
