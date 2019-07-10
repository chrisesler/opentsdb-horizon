import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// modules
import { MaterialModule } from '../shared/modules/material/material.module';
import { GridsterModule } from 'angular2gridster';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';

// routing
import { AlertsRoutingModule } from './alerts-routing.module';

// services
import { AlertsService } from './services/alerts.service';

// store
import { NgxsModule } from '@ngxs/store';
import { AlertState, AlertsState, RecipientsState } from './state';

// components
import { AlertsComponent } from './containers/alerts.component';
import { SnoozeAlertDialogComponent } from './components/snooze-alert-dialog/snooze-alert-dialog.component';
import { NameAlertDialogComponent } from './components/name-alert-dialog/name-alert-dialog.component';
import { AlertDetailsComponent } from './components/alert-details/alert-details.component';
import { DygraphsModule } from '../shared/modules/dygraphs/dygraphs.module';
// tslint:disable-next-line:max-line-length
import { AlertConfigurationContactsComponent } from './components/alert-details/children/recipients-manager/recipients-manager.component';

// directives

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        SharedcomponentsModule,
        DygraphsModule,
        AlertsRoutingModule,
        NgxsModule.forFeature([
            AlertState,
            AlertsState,
            RecipientsState
        ])
    ],
    declarations: [
        AlertsComponent,
        SnoozeAlertDialogComponent,
        NameAlertDialogComponent,
        AlertDetailsComponent,
        AlertConfigurationContactsComponent
    ],
    providers: [
        AlertsService
    ],
    entryComponents: [
        SnoozeAlertDialogComponent,
        NameAlertDialogComponent
    ]
})
export class AlertsModule { }
