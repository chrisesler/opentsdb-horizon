import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { GridsterModule } from 'angular2gridster';
import { DashboardRoutingModule } from './dashboard-routing.module';
// services
import { DashboardService } from './services/dashboard.service';
import { IntercomService } from './services/intercom.service';
import { WidgetService } from './services/widget.service';
// components
import { DashboardComponent } from './containers/dashboard/dashboard.component';
import { DboardContentComponent } from './components/dboard-content/dboard-content.component';
import { DboardHeaderComponent } from './components/dboard-header/dboard-header.component';
import { WidgetLoaderComponent } from './components/widget-loader/widget-loader.component';
import { WidgetDirective } from './directives/widget.directive';
import { WidgetViewDirective } from './directives/widgetview.directive';

// dashboard state stote
import { StoreModule } from '@ngrx/store';
import * as fromDashboard from './store/dashboard.reducer';
import { EffectsModule } from '@ngrx/effects';
import { DashboardEffects } from './store/dashboard.effects';

// widget-type component for dynamic load
import { WidgetbaseComponent } from './widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from './widgets/components/wsample/wsample.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    GridsterModule,
    DashboardRoutingModule,
    StoreModule.forFeature('dashboard', fromDashboard.reducer),
    // EffectsModule.forFeature([DashboardEffects])
  ],
  declarations: [
    DashboardComponent,
    DboardContentComponent,
    DboardHeaderComponent,
    WidgetLoaderComponent,
    WidgetDirective,
    WidgetViewDirective,
    WidgetbaseComponent,
    WsampleComponent
  ],
  providers: [
    DashboardService,
    IntercomService,
    WidgetService
  ],
  entryComponents: [WidgetbaseComponent, WsampleComponent]
})
export class DashboardModule { }
