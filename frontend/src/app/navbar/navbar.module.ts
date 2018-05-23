import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';

// containers
import { NavbarComponent } from './containers/navbar/navbar.component';

// components

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
    NavbarComponent
  ],
  providers: [ ]
})
export class NavbarModule { }
