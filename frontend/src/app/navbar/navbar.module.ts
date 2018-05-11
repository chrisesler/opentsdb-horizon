import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';

// containers
import { NavbarComponent } from './containers/navbar/navbar.component';

// components
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule
  ],
  exports: [
    NavbarComponent
  ],
  declarations: [
    NavbarComponent,
    ThemePickerComponent
  ],
  providers: [ ]
})
export class NavbarModule { }
