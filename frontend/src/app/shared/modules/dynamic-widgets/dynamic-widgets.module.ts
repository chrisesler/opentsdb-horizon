import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/modules/material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';
import { SharedcomponentsModule } from '../sharedcomponents/sharedcomponents.module';
import { PlaceholderWidgetComponent } from './components/placeholder-widget/placeholder-widget.component';
import { LinebarWidgetComponent } from './components/linebar-widget/linebar-widget.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    DygraphsModule,
    SharedcomponentsModule
  ],
  exports:[PlaceholderWidgetComponent],
  declarations: [PlaceholderWidgetComponent, LinebarWidgetComponent],
  entryComponents: [PlaceholderWidgetComponent, LinebarWidgetComponent]
})
export class DynamicWidgetsModule { }
