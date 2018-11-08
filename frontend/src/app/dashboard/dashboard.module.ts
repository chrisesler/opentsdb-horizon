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
         WidgetsConfigState, WidgetsRawdataState, UserSettingsState } from './state';

// components
import { DashboardComponent } from './containers/dashboard/dashboard.component';
import { DboardContentComponent } from './components/dboard-content/dboard-content.component';
import { WidgetLoaderComponent } from './components/widget-loader/widget-loader.component';
import { ConfigTagsListComponent } from './components/config-tags-list/config-tags-list.component';

// directives
import { WidgetDirective } from './directives/widget.directive';
import { WidgetViewDirective } from './directives/widgetview.directive';
import {
    DashboardSettingsDialogComponent,
    DbsJsonComponent,
    DbsMetaComponent,
    DbsVariablesComponent,
    DbsVariableItemComponent
} from './components/dashboard-settings-dialog';
import { DashboardSettingsToggleComponent } from './components/dashboard-settings-toggle/dashboard-settings-toggle.component';
import { DataExplorerComponent } from './components/data-explorer/data-explorer.component';
import {
    VariableTemplateBarComponent,
    VariableSelectorComponent
} from './components/variable-template-bar';
import { NavbarDashboardActionsMenuComponent } from './components/navbar-dashboard-actions-menu/navbar-dashboard-actions-menu.component';
import { DashboardSaveDialogComponent } from './components/dashboard-save-dialog/dashboard-save-dialog.component';
import { DashboardDeleteDialogComponent } from './components/dashboard-delete-dialog/dashboard-delete-dialog.component';
import { WidgetDeleteDialogComponent } from './components/widget-delete-dialog/widget-delete-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        GridsterModule,
        SharedcomponentsModule,
        DashboardRoutingModule,
        NgxsModule.forFeature([
            DBState,
            DBSettingsState,
            WidgetsState,
            ClientSizeState,
            WidgetsRawdataState,
            UserSettingsState
        ]),
        DynamicWidgetsModule
    ],
    declarations: [
        DashboardComponent,
        DboardContentComponent,
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
        VariableTemplateBarComponent,
        NavbarDashboardActionsMenuComponent,
        DashboardSaveDialogComponent,
        DashboardDeleteDialogComponent,
        VariableSelectorComponent,
        DbsVariableItemComponent,
        WidgetDeleteDialogComponent
    ],
    providers: [
        DashboardService
    ],
    entryComponents: [
        DashboardSettingsDialogComponent,
        DashboardSaveDialogComponent,
        DashboardDeleteDialogComponent,
        WidgetDeleteDialogComponent
    ]
})
export class DashboardModule { }
