import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { InfoIslandService } from './services/info-island.service';
import { InfoIslandComponent } from './containers/info-island.component';

/** possible island components */
import { IslandTestComponent } from './components/island-test/island-test.component';
import { EventStreamComponent } from './components/event-stream/event-stream.component';

import { TimeseriesLegendComponent } from './components/timeseries-legend/timeseries-legend.component';
import { MatTableModule, MatSortModule } from '@angular/material';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DragDropModule,
        OverlayModule,
        MaterialModule,
        MatTableModule,
        MatSortModule
    ],
    declarations: [
        InfoIslandComponent,
        IslandTestComponent,
        EventStreamComponent,
        TimeseriesLegendComponent
    ],
    providers: [
        InfoIslandService
    ],
    entryComponents: [
        InfoIslandComponent,
        IslandTestComponent,
        EventStreamComponent,
        TimeseriesLegendComponent
    ]
})
export class InfoIslandModule { }
