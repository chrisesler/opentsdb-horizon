import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';

import { InfoIslandRoutingModule } from './info-island-routing.module';
import { InfoIslandComponent } from './containers/info-island.component';

@NgModule({
    imports: [
        CommonModule,
        InfoIslandRoutingModule,
        DragDropModule,
        OverlayModule,
        MaterialModule
    ],
    declarations: [ InfoIslandComponent ],
    entryComponents: [ InfoIslandComponent ]
})
export class InfoIslandModule { }
