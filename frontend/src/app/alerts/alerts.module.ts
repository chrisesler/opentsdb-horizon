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
import { AlertsState } from './state';

// components
import { AlertsComponent } from './containers/alerts/alerts.component';

// directives

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        SharedcomponentsModule,
        AlertsRoutingModule,
        NgxsModule.forFeature([
            AlertsState
        ])
    ],
    declarations: [
        AlertsComponent
    ],
    providers: [
        AlertsService
    ],
    // entryComponents: []
})
export class AlertsModule { }
