import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatFormFieldModule, MatInputModule, MatTabsModule, MatCardModule, MatGridListModule, MatButtonModule } from '@angular/material';
import { MaterialModule } from '../material/material.module';
import { MatSortModule} from '@angular/material/sort';

import { EMPTY_COLOR, ColorPickerConfig } from './color-picker';
import { MccColorPickerService } from './color-picker.service';
import { MccColorPickerComponent } from './color-picker.component';
import { MccColorPickerSelectorComponent } from './color-picker-selector.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    PortalModule,
    OverlayModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    FormsModule,
    MaterialModule
  ],
  declarations: [
    MccColorPickerComponent,
    MccColorPickerSelectorComponent
  ],
  exports: [
    MccColorPickerComponent
  ],
  providers: [MccColorPickerService, { provide: EMPTY_COLOR, useValue: 'none' }],
})
export class MccColorPickerModule {

}
