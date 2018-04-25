import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './containers/dashboard/dashboard.component';
import { DboardContentComponent } from './components/dboard-content/dboard-content.component';
import { DboardHeaderComponent } from './components/dboard-header/dboard-header.component';
import { WidgetLoaderComponent } from './components/widget-loader/widget-loader.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule
  ],
  declarations: [
    DashboardComponent,
    DboardContentComponent,
    DboardHeaderComponent,
    WidgetLoaderComponent
  ]
})
export class DashboardModule { }
