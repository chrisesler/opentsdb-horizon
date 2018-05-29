import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';

import { SimpleTimePickerComponent } from './components/simple-time-picker/simple-time-picker.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
    ],
    declarations: [
        SimpleTimePickerComponent
    ],
    exports: [
        SimpleTimePickerComponent
    ]
})
export class SimpleTimePickerModule { }
