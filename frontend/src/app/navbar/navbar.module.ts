import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';

// services
//import { IntercomService } from '../dashboard/services/intercom.service';

// containers
import { NavbarComponent } from './containers/navbar/navbar.component';

// components
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';
import { CloseEditViewComponent } from './components/close-edit-view/close-edit-view.component';

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
    ThemePickerComponent,
    CloseEditViewComponent
  ],
  providers: [
    //IntercomService
  ]
})
export class NavbarModule { }
