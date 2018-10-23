import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { GridsterModule } from 'angular2gridster';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';
import { DynamicWidgetsModule } from '../shared/modules/dynamic-widgets/dynamic-widgets.module';

// services
import { DashboardService } from './services/dashboard.service';

// store
import { NgxsModule } from '@ngxs/store';
import { DBState, DBSettingsState, WidgetsState, ClientSizeState,
         WidgetsConfigState, WidgetsRawdataState } from './state';

// components
import { DashboardComponent } from './containers/dashboard/dashboard.component';
import { DboardContentComponent } from './components/dboard-content/dboard-content.component';
import { DboardHeaderComponent } from './components/dboard-header/dboard-header.component';
import { WidgetLoaderComponent } from './components/widget-loader/widget-loader.component';
import { ConfigTagsListComponent } from './components/config-tags-list/config-tags-list.component';

// directives
import { WidgetDirective } from './directives/widget.directive';
import { WidgetViewDirective } from './directives/widgetview.directive';
import {
    DashboardSettingsDialogComponent,
    DbsJsonComponent,
    DbsMetaComponent,
    DbsVariablesComponent
} from './components/dashboard-settings-dialog';
import { DashboardSettingsToggleComponent } from './components/dashboard-settings-toggle/dashboard-settings-toggle.component';
import { DataExplorerComponent } from './components/data-explorer/data-explorer.component';
import { VariableTemplateBarComponent } from './components/variable-template-bar/variable-template-bar.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        GridsterModule,
        SharedcomponentsModule,
        DashboardRoutingModule,
        NgxsModule.forFeature([DBState, DBSettingsState, WidgetsState,
            ClientSizeState, WidgetsRawdataState]),
        DynamicWidgetsModule
    ],
    declarations: [
        DashboardComponent,
        DboardContentComponent,
        DboardHeaderComponent,
        WidgetLoaderComponent,
        WidgetDirective,
        WidgetViewDirective,
        ConfigTagsListComponent,
        DashboardSettingsDialogComponent,
        DashboardSettingsToggleComponent,
        DataExplorerComponent,
        DbsMetaComponent,
        DbsVariablesComponent,
        DbsJsonComponent,
        VariableTemplateBarComponent
    ],
    providers: [
        DashboardService
    ],
    entryComponents: [
        DashboardSettingsDialogComponent
    ]
})
export class DashboardModule { }
