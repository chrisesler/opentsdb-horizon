import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';

import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule
    ],
    declarations: [
        ThemePickerComponent
    ],
    exports: [
        ThemePickerComponent
    ]
})
export class ThemePickerModule { }
