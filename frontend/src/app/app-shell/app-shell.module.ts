import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';


import { DashboardNavigatorComponent } from './components/dashboard-navigator/dashboard-navigator.component';
import { AppShellComponent } from './containers/app-shell/app-shell.component';
import { AppNavbarComponent } from './components/app-navbar/app-navbar.component';
import { TestNavigatorComponent } from './components/test-navigator/test-navigator.component';
import { NavigatorPanelItemDirective } from './directives/navigator-panel-item.directive';
import { NavigatorPanelComponent, NavigatorPanelItemElement } from './components/navigator-panel/navigator-panel.component';
import { NavigatorSidenavComponent } from './components/navigator-sidenav/navigator-sidenav.component';
import { DnavDashboardItemComponent } from './components/dashboard-navigator/children/dnav-dashboard-item/dnav-dashboard-item.component';
import { DnavFolderItemComponent } from './components/dashboard-navigator/children/dnav-folder-item/dnav-folder-item.component';
import { DnavFoldersComponent } from './components/dashboard-navigator/children/dnav-folders/dnav-folders.component';
import { DnavDashboardsComponent } from './components/dashboard-navigator/children/dnav-dashboards/dnav-dashboards.component';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        SharedcomponentsModule
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
        DnavDashboardsComponent
    ],
    exports: [
        AppShellComponent
    ]
})
export class AppShellModule { }
