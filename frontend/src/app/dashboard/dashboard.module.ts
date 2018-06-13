import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { GridsterModule } from 'angular2gridster';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ThemePickerModule } from '../shared/modules/theme-picker/theme-picker.module';
import { SimpleTimePickerModule } from '../shared/modules/simple-time-picker/simple-time-picker.module';
import { DynamicWidgetsModule } from '../shared/modules/dynamic-widgets/dynamic-widgets.module';

// services
import { DashboardService } from './services/dashboard.service';
import { WidgetService } from './services/widget.service';

// store
import { NgxsModule } from '@ngxs/store';
import { DashboardState } from './state/dashboard.state';

// components
import { DashboardComponent } from './containers/dashboard/dashboard.component';
import { DboardContentComponent } from './components/dboard-content/dboard-content.component';
import { DboardHeaderComponent } from './components/dboard-header/dboard-header.component';
import { WidgetLoaderComponent } from './components/widget-loader/widget-loader.component';
import { ConfigTagsListComponent } from './components/config-tags-list/config-tags-list.component';
import { SearchMetricsDialogComponent } from './components/search-metrics-dialog/search-metrics-dialog.component';

// directives
import { WidgetDirective } from './directives/widget.directive';
import { WidgetViewDirective } from './directives/widgetview.directive';

// widget-type component for dynamic load
import { WidgetbaseComponent } from './widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from './widgets/components/wsample/wsample.component';
import { LineChartComponent } from './widgets/components/chartjs/line-chart.component';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        GridsterModule,
        ThemePickerModule,
        SimpleTimePickerModule,
        DashboardRoutingModule,
        NgxsModule.forFeature([DashboardState]),
        DynamicWidgetsModule
    ],
    declarations: [
        DashboardComponent,
        DboardContentComponent,
        DboardHeaderComponent,
        WidgetLoaderComponent,
        WidgetDirective,
        WidgetViewDirective,
        WidgetbaseComponent,
        WsampleComponent,
        LineChartComponent,
        ConfigTagsListComponent,
        SearchMetricsDialogComponent
    ],
    providers: [
        DashboardService,
        WidgetService
    ],
    entryComponents: [
        WidgetbaseComponent,
        WsampleComponent,
        LineChartComponent,
        SearchMetricsDialogComponent
    ]
})
export class DashboardModule { }
