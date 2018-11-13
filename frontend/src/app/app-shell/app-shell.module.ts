import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


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

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        MaterialModule,
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
        NavigatorSidenavComponent
    ],
    exports: [
        AppShellComponent
    ]
})
export class AppShellModule { }
