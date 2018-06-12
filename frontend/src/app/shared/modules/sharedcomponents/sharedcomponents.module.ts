import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material/material.module';
import { SearchMetricsDialogComponent } from './components/search-metrics-dialog/search-metrics-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  declarations: [SearchMetricsDialogComponent],
  exports: [SearchMetricsDialogComponent],
  entryComponents: [SearchMetricsDialogComponent]
})
export class SharedcomponentsModule { }
