import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { InfoIslandService } from './services/info-island.service';
import { InfoIslandComponent } from './containers/info-island.component';

@NgModule({
    imports: [
        CommonModule,
        DragDropModule,
        OverlayModule,
        MaterialModule
    ],
    providers: [ InfoIslandService ],
    declarations: [ InfoIslandComponent ],
    entryComponents: [ InfoIslandComponent ]
})
export class InfoIslandModule { }
