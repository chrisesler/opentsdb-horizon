import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// store
import { NgxsModule } from '@ngxs/store';
import {
    AppShellState,
    NavigatorState,
    DashboardNavigatorState
 } from './state';


// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';

// services
import { AppShellService } from './services/app-shell.service';
import { DashboardNavigatorService } from './services/dashboard-navigator.service';

// components
import { DashboardNavigatorComponent } from './components/dashboard-navigator/dashboard-navigator.component';
import { AppShellComponent } from './containers/app-shell.component';
import { AppNavbarComponent } from './components/app-navbar/app-navbar.component';
import { TestNavigatorComponent } from './components/test-navigator/test-navigator.component';
import { NavigatorPanelItemDirective } from './directives/navigator-panel-item.directive';
import { NavigatorPanelComponent, NavigatorPanelItemElement } from './components/navigator-panel/navigator-panel.component';
import { NavigatorSidenavComponent } from './components/navigator-sidenav/navigator-sidenav.component';
import {
    DnavDashboardItemComponent,
    DnavFolderItemComponent,
    DnavFoldersComponent,
    DnavDashboardsComponent
} from './components/dashboard-navigator';
import {
    MiniNavigatorComponent,
    MiniNavigatorFoldersComponent,
    MiniNavigatorFolderItemComponent
} from './components/mini-navigator';

import {
    DbfsState,
    DbfsPanelsState,
    DbfsResourcesState,
    DbfsComponent,
    DbfsService,
    DbfsUtilsService
} from './components/dbfs';
import { DbfsFolderComponent } from './components/dbfs/children/dbfs-folder/dbfs-folder.component';
import { DbfsFileComponent } from './components/dbfs/children/dbfs-file/dbfs-file.component';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        SharedcomponentsModule,
        NgxsModule.forFeature([
            AppShellState,
            NavigatorState,
            DashboardNavigatorState,
            DbfsState,
            DbfsPanelsState,
            DbfsResourcesState,
        ]),
        RouterModule
    ],
    declarations: [
        DashboardNavigatorComponent,
        AppShellComponent,
        AppNavbarComponent,
        TestNavigatorComponent,
        NavigatorPanelItemDirective,
        NavigatorPanelComponent,
        NavigatorPanelItemElement,
        NavigatorSidenavComponent,
        DnavDashboardItemComponent,
        DnavFolderItemComponent,
        DnavFoldersComponent,
        DnavDashboardsComponent,
        MiniNavigatorComponent,
        MiniNavigatorFoldersComponent,
        MiniNavigatorFolderItemComponent,
        DbfsComponent,
        DbfsFolderComponent,
        DbfsFileComponent
    ],
    providers: [
        AppShellService,
        DashboardNavigatorService,
        DbfsService,
        DbfsUtilsService,
        { provide: 'WINDOW', useFactory: getBrowserWindow } // this is used to open dashboards in new tab
    ],
    exports: [
        AppShellComponent
    ]
})
export class AppShellModule { }

// function for WINDOW provider factory to return browser window object
export function getBrowserWindow() {
    return (typeof window !== 'undefined') ? window : null;
}
