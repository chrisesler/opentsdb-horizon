import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule } from '@angular/material';

import { EMPTY_COLOR } from './color-picker';
import { ColorPickerService } from './color-picker.service';
import { ColorPickerComponent } from './color-picker.component';
import { ColorPickerSelectorComponent } from './color-picker-selector.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    PortalModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  declarations: [
    ColorPickerComponent,
    ColorPickerSelectorComponent
  ],
  exports: [
    ColorPickerComponent
  ],
  providers: [ColorPickerService, { provide: EMPTY_COLOR, useValue: 'none' }],
})

export class ColorPickerModule { }
