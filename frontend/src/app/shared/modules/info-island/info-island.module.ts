import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { InfoIslandService } from './services/info-island.service';
import { InfoIslandComponent } from './containers/info-island.component';

/** possible island components */
import { IslandTestComponent } from './components/island-test/island-test.component';
import { EventStreamComponent } from './components/event-stream/event-stream.component';


@NgModule({
    imports: [
        CommonModule,
        DragDropModule,
        OverlayModule,
        MaterialModule
    ],
    declarations: [
        InfoIslandComponent,
        IslandTestComponent,
        EventStreamComponent
    ],
    providers: [
        InfoIslandService
    ],
    entryComponents: [
        InfoIslandComponent,
        IslandTestComponent,
        EventStreamComponent
    ]
})
export class InfoIslandModule { }
